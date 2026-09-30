import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mailSender from '../utils/mailSender.js';
import { paymentSuccessEmail } from '../mail/templates/paymentSuccessEmail.js';
import { paymentFailureEmail } from '../mail/templates/paymentFailureEmail.js';
import { refreshSubscriptionState } from '../utils/subscription.js';

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

const getRazorpayInstance = () => new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY,
    key_secret: process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET,
});

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

// Paid plans can only be activated through verifyRazorpayPayment.
// This endpoint only handles switching back to the free plan.
export const upgradePlan = async (req, res) => {
    try {
        const { plan } = req.body;

        if (plan !== "free") {
            return res.status(400).json({
                success: false,
                error: "Paid plans require payment",
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, error: "User not found" });
        }

        user.subscriptionPlan = "free";
        user.subscriptionExpiry = null;

        await user.save();

        return res.status(200).json({
            success: true,
            message: "Switched to free plan",
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
        const user = await refreshSubscriptionState(await User.findById(req.user.id));
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

        const razorpayInstance = getRazorpayInstance();

        const amountInRupees = billingCycle === "yearly"
            ? (planDetails.yearlyPrice ?? planDetails.price)
            : planDetails.price;

        const options = {
            amount: amountInRupees * 100, // amount in smallest currency unit (paise)
            currency: planDetails.currency || "INR",
            receipt: `rcpt_${req.user.id.slice(-6)}_${Date.now()}`, // Keeping it under 40 chars
            // The plan is read back from the order on verification, never from the client
            notes: { userId: req.user.id, plan, billingCycle },
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
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ success: false, error: "Missing required fields" });
        }

        // Plan, billing cycle and amount come from the order we created, not the request body
        let order;
        try {
            order = await getRazorpayInstance().orders.fetch(razorpay_order_id);
        } catch (fetchError) {
            console.error("Failed to fetch Razorpay order:", fetchError);
            return res.status(400).json({ success: false, error: "Payment verification failed" });
        }
        const { plan, billingCycle = "monthly", userId } = order?.notes || {};
        const planDetails = PLANS.find(p => p.id === plan);

        if (!planDetails || userId !== req.user.id) {
            return res.status(400).json({ success: false, error: "Payment verification failed" });
        }

        const amountInPaise = order.amount;
        const amountInRupees = amountInPaise / 100;

        const secret = process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;

        // Create the expected signature
        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest("hex");

        const signatureValid =
            typeof razorpay_signature === "string" &&
            generatedSignature.length === razorpay_signature.length &&
            crypto.timingSafeEqual(Buffer.from(generatedSignature), Buffer.from(razorpay_signature));

        // --- Signature mismatch: log a failed payment and return error ---
        if (!signatureValid) {
            await Payment.create({
                userId: req.user.id,
                plan,
                billingCycle,
                amount: amountInPaise,
                currency: order.currency || "INR",
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature: String(razorpay_signature),
                status: "failed",
            });

            // Send payment failure email
            try {
                const user = await User.findById(req.user.id);
                if (user) {
                    const failureEmail = paymentFailureEmail(
                        user.firstName || "User",
                        planDetails.name,
                        amountInRupees,
                        razorpay_order_id
                    );
                    await mailSender(user.email, "Payment Failed - Zelbi Assistant", failureEmail);
                }
            } catch (emailError) {
                console.error("Failed to send payment failure email:", emailError);
            }

            return res.status(400).json({ success: false, error: "Payment verification failed" });
        }

        // Each order can only be redeemed once
        const alreadyUsed = await Payment.exists({
            $or: [{ razorpay_order_id }, { razorpay_payment_id }],
            status: "success",
        });
        if (alreadyUsed) {
            return res.status(409).json({ success: false, error: "Payment already processed" });
        }

        // Record the payment first so the unique index rejects concurrent replays
        try {
            await Payment.create({
                userId: req.user.id,
                plan,
                billingCycle,
                amount: amountInPaise,
                currency: order.currency || "INR",
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                status: "success",
            });
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({ success: false, error: "Payment already processed" });
            }
            throw err;
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
        user.promptCountResetAt = new Date();

        await user.save();

        // Send payment success email
        try {
            const planName = planDetails?.name || plan;
            const successEmail = paymentSuccessEmail(
                user.firstName || "User",
                planName,
                amountInRupees,
                razorpay_order_id,
                razorpay_payment_id
            );
            await mailSender(user.email, "Payment Successful - Zelbi Assistant", successEmail);
        } catch (emailError) {
            console.error("Failed to send payment success email:", emailError);
        }

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
