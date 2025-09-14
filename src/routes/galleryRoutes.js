import express from "express";
import upload from "../middleware/multer.js";
import {
  createGallery,
  getGallerys,
  getGallery,
  updateCategory,
  deleteGallery,
} from "../controllers/galleryController.js";
import { auth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getGallerys);
router.get("/:id", getGallery);

router.post("/", auth, adminAuth, upload.single("image"), createGallery);
router.put("/:id", auth, adminAuth, upload.single("image"), updateCategory);
router.delete("/:id", auth, adminAuth, deleteGallery);

export default router;
