import express from "express";
import { createNewUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", createNewUser);

export default router;