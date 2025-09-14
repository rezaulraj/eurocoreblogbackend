import express from "express";
import upload from "../middleware/multer.js";
import {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import { auth, adminAuth } from "../middleware/auth.js";
const router = express.Router();

router.post("/", auth, adminAuth, upload.single("image"), createTestimonial);
router.get("/", getTestimonials);
router.get("/:id", getTestimonial);
router.put("/:id", auth, adminAuth, upload.single("image"), updateTestimonial);
router.delete("/:id", auth, adminAuth, deleteTestimonial);

export default router;
