import express from "express";
import upload from "../middleware/multer.js";
import {
  createTestimonial,
  getTestimonials,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
} from "../controllers/testimonialController.js";
import { auth } from "../middleware/auth.js";
const router = express.Router();

router.post("/", auth, upload.single("image"), createTestimonial);
router.get("/", getTestimonials);
router.get("/:id", getTestimonial);
router.put("/:id", auth, upload.single("image"), updateTestimonial);
router.delete("/:id", auth, deleteTestimonial);

export default router;
