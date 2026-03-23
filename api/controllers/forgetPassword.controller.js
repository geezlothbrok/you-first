import User from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { errorHandler } from "../utils/error.js";

// ─── Email transporter ────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Generate 6-digit code ────────────────────────────────────────────────
const generateCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

// ─── In-memory store for reset codes ─────────────────────────────────────
// { email: { code, expiresAt } }
// In production consider using Redis or storing in DB
const resetCodes = new Map();

// ── POST /api/auth/forgot-password
// Sends a 6-digit reset code to the user's email
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(errorHandler(400, "Email is required"));
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success even if email not found — security best practice
    // Don't reveal whether an email exists in the system
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If this email is correct, a reset code has been sent.",
      });
    }

    // Generate code and store with 15 minute expiry
    const code = generateCode();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    resetCodes.set(email.toLowerCase().trim(), { code, expiresAt });

    // Send email
    await transporter.sendMail({
      from: `"VitaTrack" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Your VitaTrack Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
          <div style="background-color: #8B0F1E; padding: 24px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">VitaTrack</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Your health, beautifully measured</p>
          </div>
          <div style="background-color: #FFF8F8; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #F0D0D4;">
            <h2 style="color: #1A0608; margin: 0 0 16px 0;">Password Reset Code</h2>
            <p style="color: #9E7A7E; margin: 0 0 24px 0; line-height: 1.6;">
              You requested a password reset for your VitaTrack account. 
              Use the code below to reset your password. This code expires in <strong>15 minutes</strong>.
            </p>
            <div style="background-color: #FDECEA; border: 2px solid #F0D0D4; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
              <p style="margin: 0 0 8px 0; color: #9E7A7E; font-size: 12px; letter-spacing: 1px; text-transform: uppercase;">Your reset code</p>
              <h1 style="margin: 0; color: #C0152A; font-size: 48px; letter-spacing: 8px;">${code}</h1>
            </div>
            <p style="color: #9E7A7E; margin: 0; font-size: 13px; line-height: 1.6;">
              If you didn't request this, you can safely ignore this email. 
              Your password will not be changed.
            </p>
          </div>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "If this email is correct, a reset code has been sent.",
    });

  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/verify-reset-code
// Verify the code is valid without resetting yet
export const verifyResetCode = async (req, res, next) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return next(errorHandler(400, "Email and code are required"));
    }

    const stored = resetCodes.get(email.toLowerCase().trim());

    if (!stored) {
      return next(errorHandler(400, "No reset code found. Please request a new one."));
    }

    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(email.toLowerCase().trim());
      return next(errorHandler(400, "Reset code has expired. Please request a new one."));
    }

    if (stored.code !== code.trim()) {
      return next(errorHandler(400, "Invalid reset code."));
    }

    return res.status(200).json({
      success: true,
      message: "Code verified successfully.",
    });

  } catch (error) {
    next(error);
  }
};

// ── POST /api/auth/reset-password
// Reset the password after code verification
export const resetPassword = async (req, res, next) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return next(errorHandler(400, "Email, code and new password are required"));
    }

    if (newPassword.length < 6) {
      return next(errorHandler(400, "Password must be at least 6 characters"));
    }

    const stored = resetCodes.get(email.toLowerCase().trim());

    if (!stored) {
      return next(errorHandler(400, "No reset code found. Please request a new one."));
    }

    if (Date.now() > stored.expiresAt) {
      resetCodes.delete(email.toLowerCase().trim());
      return next(errorHandler(400, "Reset code has expired. Please request a new one."));
    }

    if (stored.code !== code.trim()) {
      return next(errorHandler(400, "Invalid reset code."));
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { $set: { password: hashedPassword } }
    );

    // Remove used code
    resetCodes.delete(email.toLowerCase().trim());

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });

  } catch (error) {
    next(error);
  }
};