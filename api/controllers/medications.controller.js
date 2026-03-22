import Medication from "../models/medications.model.js";
import { errorHandler } from "../utils/error.js";

// ── GET /api/medications
// Get all active medications for the user
export const getMedications = async (req, res, next) => {
  try {
    const medications = await Medication.find({
      user: req.user._id,
      isActive: true,
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, medications });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/medications/today
// Get medications due today with taken status
export const getTodayMedications = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const medications = await Medication.find({
      user: req.user._id,
      isActive: true,
      startDate: { $lte: endOfDay },
      $or: [{ endDate: null }, { endDate: { $gte: startOfDay } }],
    });

    // Add today's taken status to each medication
    const todayMeds = medications.map((med) => {
      const takenToday = med.takenDates.some(
        (date) => date >= startOfDay && date < endOfDay
      );
      return {
        ...med.toObject(),
        takenToday,
      };
    });

    return res.status(200).json({ success: true, medications: todayMeds });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/medications
// Add a new medication
export const addMedication = async (req, res, next) => {
  try {
    const {
      name, dosage, frequency, times,
      daysOfWeek, startDate, endDate,
      instructions, color, reminderEnabled,
    } = req.body;

    if (!name || !dosage || !frequency || !times || !startDate) {
      return next(errorHandler(400, "Name, dosage, frequency, times and start date are required"));
    }

    if (!Array.isArray(times) || times.length === 0) {
      return next(errorHandler(400, "At least one time is required"));
    }

    const medication = await Medication.create({
      user: req.user._id,
      name,
      dosage,
      frequency,
      times,
      daysOfWeek: daysOfWeek || [],
      startDate,
      endDate: endDate || null,
      instructions: instructions || null,
      color: color || "#C0152A",
      reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
    });

    return res.status(201).json({
      success: true,
      message: "Medication added successfully",
      medication,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/medications/:id
// Update a medication
export const updateMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!medication) {
      return next(errorHandler(404, "Medication not found"));
    }

    const {
      name, dosage, frequency, times, daysOfWeek,
      startDate, endDate, instructions, color, reminderEnabled,
    } = req.body;

    const updated = await Medication.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          ...(name && { name }),
          ...(dosage && { dosage }),
          ...(frequency && { frequency }),
          ...(times && { times }),
          ...(daysOfWeek !== undefined && { daysOfWeek }),
          ...(startDate && { startDate }),
          ...(endDate !== undefined && { endDate }),
          ...(instructions !== undefined && { instructions }),
          ...(color && { color }),
          ...(reminderEnabled !== undefined && { reminderEnabled }),
        },
      },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      message: "Medication updated",
      medication: updated,
    });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/medications/:id/taken
// Mark medication as taken for today
export const markAsTaken = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!medication) {
      return next(errorHandler(404, "Medication not found"));
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    // Check if already marked today
    const alreadyTaken = medication.takenDates.some(
      (date) => date >= startOfDay && date < endOfDay
    );

    if (alreadyTaken) {
      return next(errorHandler(400, "Already marked as taken today"));
    }

    await Medication.findByIdAndUpdate(req.params.id, {
      $push: { takenDates: now },
    });

    return res.status(200).json({
      success: true,
      message: "Medication marked as taken",
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/medications/:id
// Soft delete
export const deleteMedication = async (req, res, next) => {
  try {
    const medication = await Medication.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!medication) {
      return next(errorHandler(404, "Medication not found"));
    }

    await Medication.findByIdAndUpdate(req.params.id, {
      $set: { isActive: false },
    });

    return res.status(200).json({
      success: true,
      message: "Medication removed",
    });
  } catch (error) {
    next(error);
  }
};