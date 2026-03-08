// routes/socialRoutes.js
import express from "express";
import {
  createSocial,
  getSocials,
  getSocialById,
  updateSocial,
  deleteSocial,
} from "../controllers/socialController.js";

const router = express.Router();

router.post("/", createSocial);
router.get("/", getSocials);
router.get("/:id", getSocialById);
router.put("/:id", updateSocial);
router.delete("/:id", deleteSocial);

export default router;
