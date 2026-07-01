import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';

const PLANS = [
    {
        id: "free",
        name: "Free",
        price: 0,
        currency: "INR",
        promptLimit: 5,
        features: [
            "5 AI prompts per month",
            "Basic market insights",
            "Dashboard access",
            "Tax calculator",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        price: 499,
        yearlyPrice: 349,
        currency: "INR",
        promptLimit: 100,
        features: [
            "100 AI prompts per month",
            "Advanced market analysis",
            "Portfolio tracking",
            "Priority support",
            "All Free features",
        ],
    },
    {
        id: "elite",
        name: "Elite",
        price: 999,
        yearlyPrice: 699,
        currency: "INR",
        promptLimit: Infinity,
        features: [
            "Unlimited AI prompts",
            "Real-time AI insights",
            "Custom trading strategies",
            "Dedicated support",
            "Early access to features",
            "All Pro features",
        ],
    },
];

export const getPlans = async (req, res) => {
    try {
        // Serialize Infinity as -1 for JSON transport
        const plansForClient = PLANS.map(p => ({
            ...p,
            promptLimit: p.promptLimit === Infinity ? -1 : p.promptLimit,
        }));
        return res.status(200).json({ success: true, plans: plansForClient });
    } catch (err) {
        console.error("Error in getPlans:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

export const upgradePlan = async (req, res) => {
    try {
        const { plan } = req.body;

        const validPlans = ["free", "pro", "elite"];
        if (!plan || !validPlans.includes(plan)) {
            return res.status(400).json({ success: false, error: "Invalid plan selected" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const currentPlanIndex = validPlans.indexOf(user.subscriptionPlan || "free");
        const newPlanIndex = validPlans.indexOf(plan);

        if (newPlanIndex <= currentPlanIndex && plan !== "free") {
            return res.status(400).json({
                success: false,
                error: "Cannot downgrade to a lower or same plan via this endpoint",
            });
        }

        // Mock payment: just update the plan (30-day expiry)
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 30);

        user.subscriptionPlan = plan;
        user.subscriptionExpiry = plan === "free" ? null : expiry;

        // Reset AI prompt count when upgrading
        user.aiPromptCount = 0;

        await user.save();

        return res.status(200).json({
            success: true,
            message: `Successfully upgraded to ${plan} plan`,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiry: user.subscriptionExpiry,
            aiPromptCount: user.aiPromptCount,
        });
    } catch (err) {
        console.error("Error in upgradePlan:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

export const getMyPlan = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select(
            "subscriptionPlan subscriptionExpiry aiPromptCount"
        );
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        const plan = PLANS.find(p => p.id === (user.subscriptionPlan || "free"));
        const promptLimit = plan?.promptLimit === Infinity ? -1 : plan?.promptLimit ?? 5;

        return res.status(200).json({
            success: true,
            subscriptionPlan: user.subscriptionPlan || "free",
            subscriptionExpiry: user.subscriptionExpiry,
            aiPromptCount: user.aiPromptCount || 0,
            promptLimit,
        });
    } catch (err) {
        console.error("Error in getMyPlan:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

export const createRazorpayOrder = async (req, res) => {
    try {
        const { plan, billingCycle = "monthly" } = req.body;

        const validPlans = ["free", "pro", "elite"];
        if (!plan || !validPlans.includes(plan)) {
            return res.status(400).json({ success: false, error: "Invalid plan selected" });
        }

        const validBillingCycles = ["monthly", "yearly"];
        if (!validBillingCycles.includes(billingCycle)) {
            return res.status(400).json({ success: false, error: "Invalid billing cycle selected" });
        }

        if (plan === "free") {
            return res.status(400).json({ success: false, error: "Free plan does not require payment" });
        }

        const planDetails = PLANS.find(p => p.id === plan);
        if (!planDetails) {
            return res.status(400).json({ success: false, error: "Plan details not found" });
        }

        const razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY,
            key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET,
        });

        const amountInRupees = billingCycle === "yearly"
            ? (planDetails.yearlyPrice ?? planDetails.price)
            : planDetails.price;

        const options = {
            amount: amountInRupees * 100, // amount in smallest currency unit (paise)
            currency: planDetails.currency || "INR",
            receipt: `rcpt_${req.user.id.slice(-6)}_${Date.now()}` // Keeping it under 40 chars
        };

        const order = await razorpayInstance.orders.create(options);

        if (!order) {
            return res.status(500).json({ success: false, error: "Failed to create Razorpay order" });
        }

        return res.status(200).json({
            success: true,
            order_id: order.id,
            amount: order.amount,
            currency: order.currency,
            key_id: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY
        });

    } catch (err) {
        console.error("Error in createRazorpayOrder:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

export const verifyRazorpayPayment = async (req, res) => {
    try {
        const { plan, billingCycle = "monthly", razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        const validBillingCycles = ["monthly", "yearly"];
        if (!validBillingCycles.includes(billingCycle)) {
            return res.status(400).json({ success: false, error: "Invalid billing cycle selected" });
        }

        const secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

        // Create the expected signature
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");

        const planDetails = PLANS.find(p => p.id === plan);
        const amountInRupees = planDetails
            ? (billingCycle === "yearly" ? (planDetails.yearlyPrice ?? planDetails.price) : planDetails.price)
            : 0;
        const amountInPaise = amountInRupees * 100;

        // --- Signature mismatch: log a failed payment and return error ---
        if (generatedSignature !== razorpay_signature) {
            await Payment.create({
                userId: req.user.id,
                plan,
                billingCycle,
                amount: amountInPaise,
                currency: planDetails?.currency || "INR",
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                status: "failed",
            });
            return res.status(400).json({ success: false, error: "Payment verification failed" });
        }

        // Payment is valid — upgrade the user's plan
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        // 30-day expiry
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (billingCycle === "yearly" ? 365 : 30));

        user.subscriptionPlan = plan;
        user.subscriptionExpiry = expiry;
        user.aiPromptCount = 0; // Reset prompt count

        await user.save();

        // --- Persist the successful payment record ---
        await Payment.create({
            userId: req.user.id,
            plan,
            billingCycle,
            amount: amountInPaise,
            currency: planDetails?.currency || "INR",
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            status: "success",
        });

        return res.status(200).json({
            success: true,
            message: `Successfully upgraded to ${plan} plan`,
            subscriptionPlan: user.subscriptionPlan,
            subscriptionExpiry: user.subscriptionExpiry,
            aiPromptCount: user.aiPromptCount,
        });

    } catch (err) {
        console.error("Error in verifyRazorpayPayment:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

export const getPaymentHistory = async (req, res) => {
    try {
        const payments = await Payment.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .select("-__v");

        return res.status(200).json({ success: true, payments });
    } catch (err) {
        console.error("Error in getPaymentHistory:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};

export { PLANS };
