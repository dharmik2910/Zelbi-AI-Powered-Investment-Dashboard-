import mongoose from "mongoose";

// One record per AI request, for usage and cost tracking. Prompts and answers aren't stored.
const aiUsageLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            index: true,
        },

        // "chat" (Zelbi Assistant) or "analysis" (Dashboard chart analysis)
        mode: {
            type: String,
        },

        model: {
            type: String,
        },

        status: {
            type: String,
            enum: ["success", "error"],
            required: true,
        },

        error: {
            type: String,
        },

        promptTokens: { type: Number, default: 0 },
        // Includes the model's thinking tokens, which are billed as output
        outputTokens: { type: Number, default: 0 },
        totalTokens: { type: Number, default: 0 },

        toolCalls: [String],

        durationMs: {
            type: Number,
        },
    },
    { timestamps: true }
);

aiUsageLogSchema.index({ createdAt: -1 });
// Keep 180 days of history
aiUsageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60, name: "createdAt_ttl" });

export default mongoose.model("AiUsageLog", aiUsageLogSchema);
