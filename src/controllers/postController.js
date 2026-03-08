// controllers/postController.js
import { validationResult } from "express-validator";
import { Op } from "sequelize";
import imgbbUploader from "imgbb-uploader";
import fs from "fs/promises";
import multer from "multer";
import path from "path";
import sharp from "sharp";
import dotenv from "dotenv";

// import Post from "../models/Post.js";
// import User from "../models/User.js";
import { Post, User } from "../models/index.js";
dotenv.config();

// (Your upload + validation helpers can stay mostly same)

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
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

const uploadBufferToImgBB = async (buffer, fileName) => {
  const base64Image = buffer.toString("base64");
  const result = await imgbbUploader({
    apiKey: process.env.IMGBB_API_KEY,
    base64string: base64Image,
    name: fileName || `post-${Date.now()}`,
  });

  return {
    url: result.url,
    imgbbId: result.id,
  };
};

const makeSlug = (title = "") => {
  let slug = String(title)
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  if (!slug) slug = `post-${Date.now()}`;
  return slug;
};

const generateUniqueSlug = async (title, excludeId = null) => {
  const baseSlug = makeSlug(title);

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const where = { slug };
    if (excludeId) {
      where.id = { [Op.ne]: excludeId };
    }

    const exists = await Post.findOne({ where, attributes: ["id"] });
    if (!exists) return slug;

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

export const createPost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    let imageData = { url: null, imgbbId: null };

    if (req.file) {
      const result = await uploadBufferToImgBB(req.file.buffer, req.body.title);
      imageData = { url: result.url, imgbbId: result.imgbbId };
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
          .filter(Boolean);
      }
    }

    const slug = await generateUniqueSlug(title);

    const post = await Post.create({
      title,
      slug,
      content,
      tags: tagsArray,
      metaDescription,
      status: status || "draft",
      isFeatured: isFeatured === true || isFeatured === "true",
      authorId: req.user.id,
      imageUrl: imageData.url,
      imgbbId: imageData.imgbbId,
      publishedAt: (status || "draft") === "published" ? new Date() : null,
    });

    const savedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "avatar"],
        },
      ],
    });

    res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const updatePost = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      Number(post.authorId) !== Number(req.user.id) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this post" });
    }

    let imageUrl = post.imageUrl;
    let imgbbId = post.imgbbId;

    if (req.file) {
      if (post.imgbbId) {
        console.log(
          "Old image remains on ImgBB (free plan limitation):",
          post.imgbbId,
        );
      }

      const result = await uploadBufferToImgBB(req.file.buffer, req.body.title);
      imageUrl = result.url;
      imgbbId = result.imgbbId;
    }

    let tagsArray = post.tags || [];
    if (req.body.tags !== undefined) {
      if (Array.isArray(req.body.tags)) {
        tagsArray = req.body.tags.map((tag) => tag.toLowerCase().trim());
      } else if (typeof req.body.tags === "string") {
        tagsArray = req.body.tags
          .split(",")
          .map((tag) => tag.toLowerCase().trim())
          .filter(Boolean);
      }
    }

    const nextStatus = req.body.status ?? post.status;

    await post.update({
      title: req.body.title ?? post.title,
      content: req.body.content ?? post.content,
      tags: tagsArray,
      metaDescription: req.body.metaDescription ?? post.metaDescription,
      status: nextStatus,
      isFeatured:
        req.body.isFeatured !== undefined
          ? req.body.isFeatured
          : post.isFeatured,
      imageUrl,
      imgbbId,
      publishedAt:
        nextStatus === "published" && !post.publishedAt
          ? new Date()
          : post.publishedAt,
    });

    const updatedPost = await Post.findByPk(post.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "avatar"],
        },
      ],
    });

    res.json(updatedPost);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      Number(post.authorId) !== Number(req.user.id) &&
      req.user.role !== "admin"
    ) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this post" });
    }

    if (post.imgbbId) {
      console.log(
        "Image remains on ImgBB (free plan limitation):",
        post.imgbbId,
      );
    }

    await post.destroy();

    res.json({
      message: "Post deleted successfully",
      note: "Image remains on ImgBB servers due to free plan limitations",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);

    const where = { status: "published" };

    if (req.query.author) where.authorId = req.query.author;

    // For tags in JSON column, simplest approach is filter in app layer OR use MySQL JSON_CONTAINS raw query.
    // Here is simple app-safe fallback:
    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [
        { model: User, as: "author", attributes: ["id", "username", "avatar"] },
      ],
      order: [
        ["publishedAt", "DESC"],
        ["createdAt", "DESC"],
      ],
      limit,
      offset: (page - 1) * limit,
    });

    let posts = rows;
    if (req.query.tag) {
      const tag = String(req.query.tag).toLowerCase();
      posts = rows.filter((p) => Array.isArray(p.tags) && p.tags.includes(tag));
    }

    const total = req.query.tag ? posts.length : count;

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

export const getPostBySlug = async (req, res) => {
  try {
    const post = await Post.findOne({
      where: { slug: req.params.slug, status: "published" },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "avatar", "bio"],
        },
      ],
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    post.viewCount += 1;
    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const totalPosts = async (req, res) => {
  try {
    const total = await Post.count();
    res.json({ success: true, totalPosts: total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 10);

    if (Number(req.user.id) !== userId && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to view these posts" });
    }

    const where = { authorId: userId };

    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "avatar"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      posts: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalPosts: count,
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAdminPosts = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const page = parseInt(req.query.page || 1);
    const limit = parseInt(req.query.limit || 20);
    const status = req.query.status;

    const where = {};
    if (status) where.status = status;

    const { rows, count } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "email"],
        },
      ],
      order: [["createdAt", "DESC"]],
      limit,
      offset: (page - 1) * limit,
    });

    res.json({
      posts: rows,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      totalPosts: count,
      hasNext: page < Math.ceil(count / limit),
      hasPrev: page > 1,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPostById = async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["id", "username", "avatar", "bio"],
        },
      ],
    });

    if (!post) return res.status(404).json({ message: "Post not found" });

    if (
      Number(post.authorId) !== Number(req.user.id) &&
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

export const toggleFeatured = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const post = await Post.findByPk(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.isFeatured = !post.isFeatured;
    await post.save();

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
