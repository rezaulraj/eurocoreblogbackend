import express from "express";
import { body } from "express-validator";
import multer from "multer";
import sharp from "sharp"; // Added for image validation
import path from "path"; // Added to fix ReferenceError

import {
  getPosts,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  getUserPosts,
  getAdminPosts,
  toggleFeatured,
  getPostById,
} from "../controllers/postController.js";

import { auth, authorAuth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Validation rules
const postValidation = [
  body("title")
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Title must be between 3 and 200 characters"),
  body("content")
    .isLength({ min: 50 })
    .withMessage("Content must be at least 50 characters"),
  body("metaDescription")
    .optional()
    .isLength({ max: 300 })
    .withMessage("Meta description must be less than 300 characters"),
  body("status")
    .optional()
    .isIn(["draft", "published", "archived"])
    .withMessage("Invalid status"),
  body("isFeatured")
    .optional()
    .isBoolean()
    .withMessage("isFeatured must be a boolean"),
];

// Multer setup for file upload (memory storage)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedFormats = /\.(jpg|jpeg|png|avif|webp)$/i;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    if (
      allowedFormats.test(ext) &&
      (mimetype === "image/jpeg" ||
        mimetype === "image/png" ||
        mimetype === "image/avif" ||
        mimetype === "image/webp")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only JPEG, PNG, avif, webp images are allowed"), false);
    }
  },
});

// Custom middleware for image validation
const validateImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    const metadata = await sharp(req.file.buffer).metadata();
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

// Public routes
router.get("/", getPosts);
router.get("/:slug", getPostBySlug);

// Protected routes
router.post(
  "/",
  auth,
  authorAuth,
  upload.single("image"),
  validateImage,
  postValidation,
  createPost
);
router.put(
  "/:id",
  auth,
  authorAuth,
  upload.single("image"),
  validateImage,
  postValidation,
  updatePost
);
router.delete("/:id", auth, deletePost);
router.get("/user/:userId", auth, getUserPosts);

// Admin routes
router.get("/id/:id", auth, getPostById);
router.get("/admin/all", auth, adminAuth, getAdminPosts);

router.patch("/:id/featured", auth, adminAuth, toggleFeatured);

export default router;
