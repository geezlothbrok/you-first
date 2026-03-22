import express from "express";
import {
  getHealthProfile,
  updateHealthProfile,
  clearHealthProfile,
} from "../controllers/health.controller.js";
import { verifyUser } from "../middleware/verifyUser.js";

const router = express.Router();

// All health routes are protected — user must be authenticated
router.get("/profile", verifyUser, getHealthProfile);
router.put("/profile", verifyUser, updateHealthProfile);
router.delete("/profile", verifyUser, clearHealthProfile);

export default router;