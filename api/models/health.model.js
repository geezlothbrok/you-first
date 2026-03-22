import mongoose from "mongoose";

const healthProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // one profile per user
    },

    // ── Basic health info
    dateOfBirth: {
      type: Date,
      default: null,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
      default: null,
    },

    bloodType: {
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"],
      default: "unknown",
    },

    height: {
      value: { type: Number, default: null }, // in cm
      unit: { type: String, default: "cm" },
    },

    weight: {
      value: { type: Number, default: null }, // in kg
      unit: { type: String, default: "kg" },
    },

    // ── Medical conditions (free text array)
    conditions: {
      type: [String],
      default: [],
    },

    // ── Allergies
    allergies: {
      type: [String],
      default: [],
    },

    // ── Current medications (names only — full schedule in medications collection)
    currentMedications: {
      type: [String],
      default: [],
    },

    // ── Emergency medical notes (shown to first responders)
    emergencyNotes: {
      type: String,
      default: null,
      maxlength: 500,
    },

    // ── Doctor info
    primaryDoctor: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
      hospital: { type: String, default: null },
    },

    // ── Insurance info
    insurance: {
      provider: { type: String, default: null },
      policyNumber: { type: String, default: null },
    },
  },
  { timestamps: true }
);

const HealthProfile = mongoose.model("HealthProfile", healthProfileSchema);
export default HealthProfile;