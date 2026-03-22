import express from "express";
import { createNewUser, loginUser } from "../controllers/auth.controller.js";
import { updateProfile, changePassword, deleteAccount } from "../controllers/profile.controller.js";
import { verifyUser } from "../middleware/verifyUser.js";


const router = express.Router();

router.post("/signup", createNewUser);
router.post("/login", loginUser);


router.put("/profile", verifyUser, updateProfile);
router.put("/change-password", verifyUser, changePassword);
router.delete("/account", verifyUser, deleteAccount);

export default router;