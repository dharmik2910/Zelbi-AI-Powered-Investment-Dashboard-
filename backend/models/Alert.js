import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
            index: true,
        },

        symbol: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },

        // Fire when the price goes above or below the target
        condition: {
            type: String,
            enum: ["above", "below"],
            required: true,
        },

        targetPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        currency: {
            type: String,
        },

        note: {
            type: String,
            trim: true,
            maxlength: 200,
        },

        status: {
            type: String,
            enum: ["active", "triggered"],
            default: "active",
        },

        triggeredAt: {
            type: Date,
        },

        triggeredPrice: {
            type: Number,
        },

        // Used to rotate through symbols fairly when the data quota is limited
        lastCheckedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

alertSchema.index({ status: 1, lastCheckedAt: 1 });

export default mongoose.model("Alert", alertSchema);
