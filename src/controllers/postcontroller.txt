import Post from "../models/Post.js";
import { validationResult } from "express-validator";
import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";
import dotenv from "dotenv";

dotenv.config();
// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadPath = "uploads/temp/";
    try {
      await fs.mkdir(uploadPath, { recursive: true });
      cb(null, uploadPath);
    } catch (err) {
      cb(err, null);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedFormats = /\.(jpg|jpeg|png)$/i;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (
      allowedFormats.test(ext) &&
      (mimetype === "image/jpeg" || mimetype === "image/png")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG and PNG images are allowed"), false);
    }
  },
});

// Custom middleware for image validation
const validateImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const metadata = await sharp(req.file.path || req.file.buffer).metadata();
    const minWidth = 800;
    const minHeight = 600;
    const acceptableRatios = [16 / 9, 4 / 3]; // Allow 16:9 or 4:3 aspect ratios

    if (metadata.width < minWidth || metadata.height < minHeight) {
      return res.status(400).json({
        message: `Image dimensions must be at least ${minWidth}x${minHeight} pixels`,
      });
    }

    const aspectRatio = metadata.width / metadata.height;
    const isValidRatio = acceptableRatios.some(
      (ratio) => Math.abs(aspectRatio - ratio) < 0.1 // Allow slight deviation
    );
    if (!isValidRatio) {
      return res.status(400).json({
        message: "Image must have a 16:9 or 4:3 aspect ratio",
      });
    }

    next();
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid image file", error: error.message });
  }
};

// @desc    Upload image to Cloudinary
// @route   POST /api/posts/upload
// @access  Private
export const uploadImage = async (req, res) => {
  try {
    await new Promise((resolve, reject) => {
      upload.single("image")(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    // Apply image validation
    await validateImage(req, res, () => {});

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "blog-posts",
      transformation: [
        { width: 1200, height: 630, crop: "limit", quality: "auto" },
        { format: "auto" },
      ],
    });

    await fs.unlink(req.file.path);

    res.json({
      success: true,
      image: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    if (
      req.file &&
      (await fs
        .access(req.file.path)
        .then(() => true)
        .catch(() => false))
    ) {
      await fs
        .unlink(req.file.path)
        .catch((e) => console.error("Cleanup failed:", e));
    }
    console.error("Upload error:", error);
    res
      .status(500)
      .json({ message: "Image upload failed", error: error.message });
  }
};

// @desc    Delete image from Cloudinary
// @route   DELETE /api/posts/upload/:publicId
// @access  Private
export const deleteImage = async (req, res) => {
  try {
    const { publicId } = req.params;
    if (!publicId || !/^[a-zA-Z0-9_-]+$/.test(publicId)) {
      return res.status(400).json({ message: "Invalid publicId format" });
    }

    const result = await cloudinary.uploader.destroy(publicId);
    if (result.result === "ok") {
      res.json({ success: true, message: "Image deleted successfully" });
    } else {
      res.status(404).json({ message: "Image not found" });
    }
  } catch (error) {
    console.error("Delete error:", error);
    res
      .status(500)
      .json({ message: "Image deletion failed", error: error.message });
  }
};

// @desc    Create post
// @route   POST /api/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    let imageData = null;
    if (req.file) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "blog-posts",
              transformation: [{ width: 1200, height: 630, crop: "limit" }],
            },
            (error, result) => {
              if (error) {
                console.error("Cloudinary upload error:", error);
                reject(error);
              } else {
                console.log("Cloudinary upload successful:", result);
                resolve(result);
              }
            }
          );
          uploadStream.end(req.file.buffer);
        });

        imageData = {
          url: result.secure_url,
          publicId: result.public_id,
        };
      } catch (error) {
        console.error("Image upload failed:", error);
        return res.status(500).json({
          message: "Image upload failed",
          error: error.message,
        });
      }
    }

    const { title, content, tags, metaDescription, status, isFeatured } =
      req.body;

    let tagsArray = [];
    if (tags) {
      if (Array.isArray(tags)) {
        tagsArray = tags.map((tag) => tag.toLowerCase().trim());
      } else if (typeof tags === "string") {
        tagsArray = tags
          .split(",")
          .map((tag) => tag.toLowerCase().trim())
          .filter((tag) => tag);
      }
    }
    const post = new Post({
      title,
      content,
      tags: tagsArray,
      metaDescription,
      status: status || "draft",
      isFeatured: isFeatured || false,
      author: req.user.id,
      image: imageData,
    });
    const savedPost = await post.save();
    await savedPost.populate("author", "username avatar");

    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private
export const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    let imageData = post.image;
    if (req.file) {
      if (post.image?.publicId) {
        try {
          await cloudinary.uploader.destroy(post.image.publicId);
        } catch (deleteError) {
          console.error("Error deleting old image:", deleteError);
        }
      }

      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: "blog-posts",
              transformation: [{ width: 1200, height: 630, crop: "limit" }],
              invalidate: true,
            },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(req.file.buffer);
        });

        imageData = { url: result.secure_url, publicId: result.public_id };
      } catch (uploadError) {
        return res.status(500).json({
          message: "Image upload failed",
          error: uploadError.message,
        });
      }
    }

    const { title, content, tags, metaDescription, status, isFeatured } =
      req.body;

    // ✅ Normalize tags safely
    let tagsArray = post.tags; // fallback to existing
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        tagsArray = tags.map((tag) => tag.toLowerCase().trim());
      } else if (typeof tags === "string") {
        tagsArray = tags
          .split(",")
          .map((tag) => tag.toLowerCase().trim())
          .filter((tag) => tag);
      }
    }

    // ✅ Update fields
    post.title = title ?? post.title;
    post.content = content ?? post.content;
    post.tags = tagsArray;
    post.metaDescription = metaDescription ?? post.metaDescription;
    post.status = status ?? post.status;
    post.isFeatured = isFeatured ?? post.isFeatured;
    post.image = imageData;

    const updatedPost = await post.save();
    await updatedPost.populate("author", "username avatar");

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.author.toString() !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    if (post.image?.publicId)
      await cloudinary.uploader.destroy(post.image.publicId);
    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { status: "published" };
    if (req.query.tag) filter.tags = req.query.tag.toLowerCase();
    if (req.query.author) filter.author = req.query.author;

    const posts = await Post.find(filter)
      .populate("author", "username avatar")
      .sort({ publishedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get post by slug
// @route   GET /api/posts/:slug
// @access  Public
export const getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({
      slug: req.params.slug,
      status: "published",
    }).populate("author", "username avatar bio");
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.viewCount += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user's posts
// @route   GET /api/posts/user/:userId
// @access  Private
export const getUserPosts = async (req, res) => {
  try {
    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    if (userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view these posts" });
    }

    const filter = { author: userId };
    if (userId !== req.user.id && req.user.role !== "admin")
      filter.status = "published";

    const posts = await Post.find(filter)
      .populate("author", "username avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get posts for admin dashboard
// @route   GET /api/posts/admin/all
// @access  Private (Admin only)
export const getAdminPosts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const filter = {};
    if (status) filter.status = status;

    const posts = await Post.find(filter)
      .populate("author", "username email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments(filter);

    res.json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get post by ID (for editing)
// @route   GET /api/posts/id/:id
// @access  Private
export const getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate(
      "author",
      "username avatar bio"
    );

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if user is authorized to view this post (author or admin)
    if (
      post.author._id.toString() !== req.user.id &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this post" });
    }

    res.json(post);
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle post featured status
// @route   PATCH /api/posts/:id/featured
// @access  Private (Admin only)
export const toggleFeatured = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.isFeatured = !post.isFeatured;
    const updatedPost = await post.save();

    res.json(updatedPost);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const totalPosts = async (req, res) => {
  try {
    const totalPosts = await Post.countDocuments();
    // console.log("totalpost", totalPosts);
    res.json({ success: true, totalPosts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
};
