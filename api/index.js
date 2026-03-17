import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";


dotenv.config();

mongoose.connect(process.env.MONGO_SECRET_KEY) 
  .then(() => console.log("MongoDB is connected"))
  .catch((error) => {
    console.log("MongoDB connection failed:", error.message);
    process.exit(1);
  });

const app = express();

app.listen(3000, () => {
    console.log("Server is running on port 3000");
})