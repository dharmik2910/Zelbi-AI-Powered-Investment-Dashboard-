import mongoose from "mongoose";

// One record per email sent through Brevo. The body is never stored, since it can
// contain OTPs and password reset links.
const emailLogSchema = new mongoose.Schema(
    {
        to: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            index: true,
        },

        // otp, password_reset, password_changed, invite, payment_success, payment_failed, price_alert, other
        type: {
            type: String,
            default: "other",
        },

        subject: {
            type: String,
        },

        // "sent" or "failed" when handed to Brevo; webhook events update it later
        status: {
            type: String,
            enum: ["sent", "failed", "delivered", "deferred", "bounced", "blocked", "spam", "invalid", "opened", "clicked"],
            default: "sent",
        },

        error: {
            type: String,
        },

        // Brevo's message id, used to match delivery webhooks
        messageId: {
            type: String,
            index: true,
        },

        events: [
            {
                _id: false,
                event: String,
                at: Date,
                reason: String,
            },
        ],
    },
    { timestamps: true }
);

emailLogSchema.index({ createdAt: -1 });
// Keep 90 days of history
emailLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60, name: "createdAt_ttl" });

export default mongoose.model("EmailLog", emailLogSchema);
