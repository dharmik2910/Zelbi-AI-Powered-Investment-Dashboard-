import express from "express";
import { login, signup, sendotp, changePassword, googleAuth } from "../controllers/Auth.js";
import { resetPasswordToken, resetPassword } from "../controllers/ResetPassword.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/sendotp", sendotp);
router.post("/changepassword", auth, changePassword);
router.post("/reset-password-token", resetPasswordToken);
router.post("/reset-password", resetPassword);
router.post("/google-auth", googleAuth);

export default router;
