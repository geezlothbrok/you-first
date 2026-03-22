import express from "express";
import {
  getMedications,
  getTodayMedications,
  addMedication,
  updateMedication,
  markAsTaken,
  deleteMedication,
} from "../controllers/medications.controller.js";
import { verifyUser } from "../middleware/verifyUser.js";

const router = express.Router();

// All medication routes are protected
router.get("/", verifyUser, getMedications);
router.get("/today", verifyUser, getTodayMedications);
router.post("/", verifyUser, addMedication);
router.put("/:id", verifyUser, updateMedication);
router.post("/:id/taken", verifyUser, markAsTaken);
router.delete("/:id", verifyUser, deleteMedication);

export default router;