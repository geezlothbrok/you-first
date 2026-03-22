import express from "express";
import {
  getSOSContacts,
  addSOSContact,
  updateSOSContact,
  deleteSOSContact,
} from "../controllers/sos.controller.js";
import { verifyUser } from "../middleware/verifyUser.js";

const router = express.Router();

// All SOS routes are protected
router.get("/contacts", verifyUser, getSOSContacts);
router.post("/contacts", verifyUser, addSOSContact);
router.put("/contacts/:id", verifyUser, updateSOSContact);
router.delete("/contacts/:id", verifyUser, deleteSOSContact);

export default router;