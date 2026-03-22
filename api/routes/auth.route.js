import express from "express";
import { createNewUser, loginUser } from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/signup", createNewUser);
router.post("/login", loginUser);

export default router;