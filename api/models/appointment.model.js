import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    doctorName: {
      type: String,
      required: true,
      trim: true,
    },

    specialty: {
      type: String,
      trim: true,
      default: null, // e.g. "Cardiology", "General Practice"
    },

    hospital: {
      type: String,
      trim: true,
      default: null,
    },

    date: {
      type: Date,
      required: true,
    },

    time: {
      type: String,
      required: true, // e.g. "10:30 AM"
    },

    type: {
      type: String,
      enum: [
        "checkup",
        "follow_up",
        "consultation",
        "procedure",
        "lab_test",
        "vaccination",
        "other",
      ],
      default: "checkup",
    },

    notes: {
      type: String,
      default: null,
      maxlength: 500,
    },

    reminderEnabled: {
      type: Boolean,
      default: true,
    },

    // reminder sent 24 hours before
    reminderSent: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["upcoming", "completed", "cancelled"],
      default: "upcoming",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;