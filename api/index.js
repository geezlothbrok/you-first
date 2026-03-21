import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_SECRET_KEY)
  .then(() => console.log("MongoDB is connected"))
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
    process.exit(1);
  });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes (must be before error middleware)
app.use("/api/auth", authRoutes);

// ── Global error handler (needs all 4 params to work)
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});