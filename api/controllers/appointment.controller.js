import Appointment from "../models/appointment.model.js";
import { errorHandler } from "../utils/error.js";

// ── GET /api/appointments
// Get all active appointments sorted by date
export const getAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({
      user: req.user._id,
      isActive: true,
    }).sort({ date: 1 }); // soonest first

    return res.status(200).json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/appointments/upcoming
// Get only upcoming appointments (today and future)
export const getUpcomingAppointments = async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const appointments = await Appointment.find({
      user: req.user._id,
      isActive: true,
      status: "upcoming",
      date: { $gte: startOfToday },
    })
      .sort({ date: 1 })
      .limit(5); // home screen only needs next 5

    return res.status(200).json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/appointments
// Create a new appointment
export const addAppointment = async (req, res, next) => {
  try {
    const {
      doctorName, specialty, hospital,
      date, time, type, notes, reminderEnabled,
    } = req.body;

    if (!doctorName || !date || !time) {
      return next(errorHandler(400, "Doctor name, date and time are required"));
    }

    const appointment = await Appointment.create({
      user: req.user._id,
      doctorName,
      specialty: specialty || null,
      hospital: hospital || null,
      date,
      time,
      type: type || "checkup",
      notes: notes || null,
      reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
    });

    return res.status(201).json({
      success: true,
      message: "Appointment added successfully",
      appointment,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/appointments/:id
// Update an appointment
export const updateAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!appointment) {
      return next(errorHandler(404, "Appointment not found"));
    }

    const {
      doctorName, specialty, hospital,
      date, time, type, notes,
      reminderEnabled, status,
    } = req.body;

    const updated = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(doctorName && { doctorName }),
          ...(specialty !== undefined && { specialty }),
          ...(hospital !== undefined && { hospital }),
          ...(date && { date }),
          ...(time && { time }),
          ...(type && { type }),
          ...(notes !== undefined && { notes }),
          ...(reminderEnabled !== undefined && { reminderEnabled }),
          ...(status && { status }),
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Appointment updated",
      appointment: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/appointments/:id/status
// Mark as completed or cancelled
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!["upcoming", "completed", "cancelled"].includes(status)) {
      return next(errorHandler(400, "Invalid status"));
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!appointment) {
      return next(errorHandler(404, "Appointment not found"));
    }

    await Appointment.findByIdAndUpdate(req.params.id, {
      $set: { status },
    });

    return res.status(200).json({
      success: true,
      message: `Appointment marked as ${status}`,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/appointments/:id
// Soft delete
export const deleteAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!appointment) {
      return next(errorHandler(404, "Appointment not found"));
    }

    await Appointment.findByIdAndUpdate(req.params.id, {
      $set: { isActive: false },
    });

    return res.status(200).json({
      success: true,
      message: "Appointment removed",
    });
  } catch (error) {
    next(error);
  }
};