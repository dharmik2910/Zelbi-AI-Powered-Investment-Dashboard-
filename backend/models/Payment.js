import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },

        plan: {
            type: String,
            enum: ["pro", "elite"],
            required: true,
        },

        billingCycle: {
            type: String,
            enum: ["monthly", "yearly"],
            default: "monthly",
        },

        amount: {
            type: Number, // in paise (smallest INR unit)
            required: true,
        },

        currency: {
            type: String,
            default: "INR",
        },

        razorpay_order_id: {
            type: String,
            required: true,
        },

        razorpay_payment_id: {
            type: String,
            required: true,
        },

        razorpay_signature: {
            type: String,
            required: true,
        },

        // "success" — signature verified & plan upgraded
        // "failed"  — signature mismatch / verification error
        status: {
            type: String,
            enum: ["success", "failed"],
            required: true,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
