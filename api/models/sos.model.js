import mongoose from "mongoose";

const sosContactSchema = new mongoose.Schema(
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

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    relationship: {
      type: String,
      enum: ["parent", "spouse", "sibling", "child", "friend", "doctor", "colleague", "other"],
      default: "other",
    },

    // Priority order — 1 is contacted first
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },

    // Whether to include live location in SMS alert
    sendLocation: {
      type: Boolean,
      default: true,
    },

    // Custom SMS message — if null, default message is used
    customMessage: {
      type: String,
      default: null,
      maxlength: 300,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Max 5 SOS contacts per user
sosContactSchema.pre("save", async function () {
  if (this.isNew) {
    const count = await mongoose.model("SOSContact").countDocuments({
      user: this.user,
      isActive: true,
    });
    if (count >= 5) {
      throw new Error("Maximum of 5 SOS contacts allowed"); // ← throw instead of next()
    }
  }
});

const SOSContact = mongoose.model("SOSContact", sosContactSchema);
export default SOSContact;