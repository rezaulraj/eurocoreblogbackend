import express from "express";
import { body } from "express-validator";
import multer from "multer";
import sharp from "sharp";
import path from "path";

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
  totalPosts,
} from "../controllers/postController.js";

import { auth } from "../middleware/auth.js";

const router = express.Router();

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

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  // Remove the limits fileSize restriction or set it higher
  // limits: { fileSize: 5 * 1024 * 1024 }, // Comment this out or increase it
  limits: { fileSize: 50 * 1024 * 1024 }, // Optional: set to 50MB if you still want some limit
  fileFilter: (req, file, cb) => {
    const allowedFormats = /\.(jpg|jpeg|png|avif|webp|gif|bmp|tiff)$/i;
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    // Allow more image formats
    if (
      allowedFormats.test(ext) &&
      [
        "image/jpeg",
        "image/png",
        "image/avif",
        "image/webp",
        "image/gif",
        "image/bmp",
        "image/tiff",
      ].includes(mimetype)
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only JPEG, PNG, AVIF, WebP, GIF, BMP, and TIFF images are allowed",
        ),
        false,
      );
    }
  },
});

// Updated validation middleware - removed dimension and ratio restrictions
const validateImage = async (req, res, next) => {
  if (!req.file) return next();

  try {
    // Just verify it's a valid image file
    await sharp(req.file.buffer).metadata();
    next();
  } catch (error) {
    res
      .status(400)
      .json({ message: "Invalid image file", error: error.message });
  }
};

// Public
router.get("/total", totalPosts);
router.get("/", getPosts);

// Protected
router.get("/user/:userId", auth, getUserPosts);
router.get("/id/:id", auth, getPostById);
router.get("/admin/all", auth, getAdminPosts);

router.post(
  "/",
  auth,
  upload.single("image"),
  validateImage,
  postValidation,
  createPost,
);

router.put(
  "/:id",
  auth,
  upload.single("image"),
  validateImage,
  postValidation,
  updatePost,
);

router.delete("/:id", auth, deletePost);
router.patch("/:id/featured", auth, toggleFeatured);

// Slug route LAST
router.get("/:slug", getPostBySlug);

export default router;
