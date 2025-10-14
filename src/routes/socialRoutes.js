import express from "express";
import {
  getSocials,
  getSocial,
  createSocial,
  updateSocial,
  deleteSocial,
} from "../controllers/socialController.js";

const router = express.Router();

// CRUD routes
router.get("/", getSocials);
router.get("/:id", getSocial);
router.post("/", createSocial);
router.put("/:id", updateSocial);
router.delete("/:id", deleteSocial);

export default router;
