// routes/galleryRoutes.js
import express from "express";
import upload from "../middleware/multer.js";
import {
  createGallery,
  getGalleries,
  getGalleryById,
  updateGallery,
  deleteGallery,
} from "../controllers/galleryController.js";
import { auth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getGalleries);
router.get("/:id", getGalleryById);

router.post("/", auth, upload.single("image"), createGallery);
router.put("/:id", auth, upload.single("image"), updateGallery);
router.delete("/:id", auth, deleteGallery);

export default router;
