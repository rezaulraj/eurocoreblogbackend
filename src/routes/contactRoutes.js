// routes/contactRoutes.js
import express from "express";
import {
  createContact,
  getContacts,
  getContactById,
  updateContact,
  deleteContact,
  bulkDeleteContacts,
  getContactStats,
} from "../controllers/contactController.js";

const router = express.Router();

// Public routes
router
  .route("/")
  .post(createContact)
  .get(getContacts)
  .delete(bulkDeleteContacts);

router.route("/stats/count").get(getContactStats);

router
  .route("/:id")
  .get(getContactById)
  .put(updateContact)
  .delete(deleteContact);

export default router;
