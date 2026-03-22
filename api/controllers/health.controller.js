import HealthProfile from "../models/health.model.js";
import { errorHandler } from "../utils/error.js";

// ── GET /api/health/profile
// Returns the authenticated user's health profile
export const getHealthProfile = async (req, res, next) => {
  try {
    let profile = await HealthProfile.findOne({ user: req.user._id });

    // Auto-create an empty profile if one doesn't exist yet
    if (!profile) {
      profile = await HealthProfile.create({ user: req.user._id });
    }

    return res.status(200).json({
      success: true,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/health/profile
// Creates or updates the user's health profile (upsert)
export const updateHealthProfile = async (req, res, next) => {
  try {
    const {
      dateOfBirth,
      gender,
      bloodType,
      height,
      weight,
      conditions,
      allergies,
      currentMedications,
      emergencyNotes,
      primaryDoctor,
      insurance,
    } = req.body;

    const profile = await HealthProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          dateOfBirth: dateOfBirth ?? null,
          gender: gender ?? null,
          bloodType: bloodType ?? "unknown",
          height: height ?? { value: null, unit: "cm" },
          weight: weight ?? { value: null, unit: "kg" },
          conditions: conditions ?? [], // ← explicit, no conditional spread
          allergies: allergies ?? [], // ← explicit
          currentMedications: currentMedications ?? [], // ← explicit
          emergencyNotes: emergencyNotes ?? null,
          primaryDoctor: primaryDoctor ?? {
            name: null,
            phone: null,
            hospital: null,
          },
          insurance: insurance ?? { provider: null, policyNumber: null },
        },
      },
      {
        new: true, // return updated document
        upsert: true, // create if doesn't exist
        runValidators: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Health profile updated successfully",
      profile,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/health/profile
// Clears the health profile (resets to defaults, doesn't delete the document)
export const clearHealthProfile = async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: {
          dateOfBirth: null,
          gender: null,
          bloodType: "unknown",
          height: { value: null, unit: "cm" },
          weight: { value: null, unit: "kg" },
          conditions: [],
          allergies: [],
          currentMedications: [],
          emergencyNotes: null,
          primaryDoctor: { name: null, phone: null, hospital: null },
          insurance: { provider: null, policyNumber: null },
        },
      },
      { new: true },
    );

    return res.status(200).json({
      success: true,
      message: "Health profile cleared",
      profile,
    });
  } catch (error) {
    next(error);
  }
};
