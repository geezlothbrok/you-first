import express from "express";
import {
  getAppointments,
  getUpcomingAppointments,
  addAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
} from "../controllers/appointment.controller.js";
import { verifyUser } from "../middleware/verifyUser.js";

const router = express.Router();

router.get("/", verifyUser, getAppointments);
router.get("/upcoming", verifyUser, getUpcomingAppointments);
router.post("/", verifyUser, addAppointment);
router.put("/:id", verifyUser, updateAppointment);
router.put("/:id/status", verifyUser, updateAppointmentStatus);
router.delete("/:id", verifyUser, deleteAppointment);

export default router;