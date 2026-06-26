import express from "express";
import { getPlans, getMyPlan, upgradePlan, createRazorpayOrder, verifyRazorpayPayment, getPaymentHistory } from "../controllers/Subscription.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

router.get("/plans", getPlans);
router.get("/my-plan", auth, getMyPlan);
router.post("/upgrade", auth, upgradePlan);
router.post("/create-razorpay-order", auth, createRazorpayOrder);
router.post("/verify-razorpay-payment", auth, verifyRazorpayPayment);
router.get("/payment-history", auth, getPaymentHistory);

export default router;
