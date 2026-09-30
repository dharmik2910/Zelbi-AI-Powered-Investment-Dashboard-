import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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

        name: {
            type: String,
            trim: true,
        },

        // Trading currency, e.g. INR or USD. Decides which tax rules apply.
        currency: {
            type: String,
        },

        type: {
            type: String,
            enum: ["buy", "sell"],
            required: true,
        },

        quantity: {
            type: Number,
            required: true,
            min: 0,
        },

        // Price per share, in the stock's trading currency
        price: {
            type: Number,
            required: true,
            min: 0,
        },

        // Brokerage and other charges for the whole trade
        fees: {
            type: Number,
            default: 0,
            min: 0,
        },

        date: {
            type: Date,
            required: true,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

transactionSchema.index({ userId: 1, symbol: 1, date: 1 });

export default mongoose.model("Transaction", transactionSchema);
