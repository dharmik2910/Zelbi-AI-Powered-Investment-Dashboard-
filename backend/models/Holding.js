import mongoose from "mongoose";

const holdingSchema = new mongoose.Schema(
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

        quantity: {
            type: Number,
            required: true,
            min: 0,
        },

        // Average buy price per share, in the stock's trading currency
        avgPrice: {
            type: Number,
            required: true,
            min: 0,
        },

        buyDate: {
            type: Date,
        },

        notes: {
            type: String,
            trim: true,
            maxlength: 500,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Holding", holdingSchema);
