import mongoose from "mongoose";

// Record of every change an admin makes, for accountability
const adminAuditLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },

        adminEmail: {
            type: String,
        },

        action: {
            type: String,
            required: true,
        },

        targetUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },

        targetEmail: {
            type: String,
        },

        // Before and after values of the fields that changed
        details: {
            type: mongoose.Schema.Types.Mixed,
        },
    },
    { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model("AdminAuditLog", adminAuditLogSchema);
