import express from "express";
import {
  createAnalytics,
  getAnalytics,
  getAnalyticsById,
  updateAnalytics,
  deleteAnalytics,
} from "../controllers/analyticsController.js";
import { auth, adminAuth } from "../middleware/auth.js";

const router = express.Router();

// ✅ Only Admins can add/update/delete analytics
router.post("/", auth, adminAuth, createAnalytics);
router.get("/", auth, getAnalytics);
router.get("/:id", auth, getAnalyticsById);
router.put("/:id", auth, adminAuth, updateAnalytics);
router.delete("/:id", auth, adminAuth, deleteAnalytics);

export default router;
