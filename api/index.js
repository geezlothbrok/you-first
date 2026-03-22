import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.route.js";
import healthRoutes from "./routes/health.route.js";
import sosRoutes from "./routes/sos.routes.js";
import medicationRoutes from "./routes/medications.route.js";
import appointmentRoutes from "./routes/appointment.route.js";

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
app.use("/api/health", healthRoutes);
app.use("/api/sos", sosRoutes);
app.use("/api/medications", medicationRoutes);
app.use("/api/appointments", appointmentRoutes);


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