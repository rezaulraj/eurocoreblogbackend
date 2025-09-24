import express from "express";
import {
  createAnalysis,
  getAllAnalyses,
  getAnalysisById,
  updateAnalysis,
  deleteAnalysis,
  getAnalysesBySource,
} from "../controllers/analysisController.js";

const router = express.Router();

// CRUD Routes
router.post("/analyses", createAnalysis);
router.get("/analyses", getAllAnalyses);
router.get("/analyses/source/:source", getAnalysesBySource);
router.get("/analyses/:id", getAnalysisById);
router.put("/analyses/:id", updateAnalysis);
router.delete("/analyses/:id", deleteAnalysis);

export default router;
