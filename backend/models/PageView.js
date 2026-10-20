import mongoose from "mongoose";

// One record per page visited on the website. IP addresses aren't stored.
const pageViewSchema = new mongoose.Schema(
    {
        path: {
            type: String,
            required: true,
        },

        // Signed-in visitor, if any
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
        },

        // Random id kept for one browser tab session, used to count unique visitors
        sessionId: {
            type: String,
        },

        // Domain the visitor came from, e.g. google.com
        referrer: {
            type: String,
        },

        device: {
            type: String,
            enum: ["mobile", "tablet", "desktop"],
        },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

pageViewSchema.index({ createdAt: -1 });
pageViewSchema.index({ path: 1, createdAt: -1 });
// Keep 90 days of history
pageViewSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60, name: "createdAt_ttl" });

export default mongoose.model("PageView", pageViewSchema);
