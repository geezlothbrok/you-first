import User from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import { errorHandler } from "../utils/error.js";

// ── PUT /api/auth/profile
// Update name, email, phone
export const updateProfile = async (req, res, next) => {
  try {
    const { fullName, email, phone } = req.body;

    if (!fullName && !email && !phone) {
      return next(errorHandler(400, "Nothing to update"));
    }

    // Check if email is taken by another user
    if (email) {
      const existing = await User.findOne({
        email: email.toLowerCase().trim(),
        _id: { $ne: req.user._id },
      });
      if (existing) {
        return next(errorHandler(400, "Email is already in use"));
      }
    }

    const updated = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          ...(fullName && { fullName: fullName.trim() }),
          ...(email && { email: email.toLowerCase().trim() }),
          ...(phone !== undefined && { phone: phone || null }),
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updated._id,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
        profilePhoto: updated.profilePhoto,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/auth/change-password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return next(errorHandler(400, "Current and new password are required"));
    }

    if (newPassword.length < 6) {
      return next(errorHandler(400, "New password must be at least 6 characters"));
    }

    // Get user with password
    const user = await User.findById(req.user._id);

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return next(errorHandler(400, "Current password is incorrect"));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findByIdAndUpdate(req.user._id, {
      $set: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/auth/account
// Soft delete — marks account as deleted
export const deleteAccount = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return next(errorHandler(400, "Password is required to delete account"));
    }

    const user = await User.findById(req.user._id);
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return next(errorHandler(400, "Incorrect password"));
    }

    // Soft delete — anonymize the account
    await User.findByIdAndUpdate(req.user._id, {
      $set: {
        fullName: "Deleted User",
        email: `deleted_${req.user._id}@vitatrack.app`,
        phone: null,
        profilePhoto: null,
        isDeleted: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};