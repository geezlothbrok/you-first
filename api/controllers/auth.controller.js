import User from "../models/auth.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { errorHandler } from "../utils/error.js";

export const createNewUser = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    // 1. Validate input
    if (!fullName || !email || !password) {
      return next(errorHandler(400, "All fields are required"))
    }

    // 2. Check if user exists
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return next(errorHandler(400, "User already exist"))
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create user
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
    });

    // 5. Generate JWT (important for mobile auth)
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6. Send response
    return res.status(201).json({
      success: true,
      message: "User created successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });

  } catch (error) {
    next(error);
  }
};


//LOGIN
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return next(errorHandler(400, "Email and password are required"));
    }

    // 2. Find user
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return next(errorHandler(401, "Invalid email or password"));
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(errorHandler(401, "Invalid email or password"));
    }

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "365d" }
    );

    // 5. Send response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
      },
    });

  } catch (error) {
    next(error);
  }
};