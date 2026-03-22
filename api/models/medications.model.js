import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    dosage: {
      type: String,
      required: true,
      trim: true, // e.g. "500mg", "2 tablets"
    },

    frequency: {
      type: String,
      enum: ["once_daily", "twice_daily", "three_times_daily", "four_times_daily", "weekly", "as_needed"],
      required: true,
    },

    // Times of day to take the medication e.g. ["08:00", "14:00", "20:00"]
    times: {
      type: [String],
      required: true,
    },

    // Days of week for weekly medications (0=Sun, 1=Mon ... 6=Sat)
    daysOfWeek: {
      type: [Number],
      default: [],
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      default: null, // null means ongoing
    },

    instructions: {
      type: String,
      default: null, // e.g. "Take with food", "Avoid alcohol"
      maxlength: 200,
    },

    color: {
      type: String,
      default: "#C0152A", // pill color for UI
    },

    reminderEnabled: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Track adherence — array of dates medication was taken
    takenDates: {
      type: [Date],
      default: [],
    },
  },
  { timestamps: true }
);

const Medication = mongoose.model("Medication", medicationSchema);
export default Medication;