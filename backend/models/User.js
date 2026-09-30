import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        trim: true,
    },

    lastName: {
        type: String,
        trim: true,
    },

    email: {
        type: String,
        required: true,
        trim: true,
    },

    password: {
        type: String,
        required: function () {
            return !this.googleId; // Password not required for OAuth users
        },
    },

    acceptedTerms: {
        type: Boolean,
        default: false,
    },

    acceptedTermsAt: {
        type: Date,
    },

    termsVersion: {
        type: String,
        default: "v1.0",
    },

    googleId: {
        type: String,
    },

    image: {
        type: String,
    },

    additionalDetails: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Profile",
    },

    resetPasswordExpires: {
        type: Date,
    },

    token: {
        type: String,
    },

    aiPromptCount: {
        type: Number,
        default: 0,
    },

    subscriptionPlan: {
        type: String,
        enum: ["free", "pro", "elite"],
        default: "free",
    },

    subscriptionExpiry: {
        type: Date,
        default: null,
    },

    // When aiPromptCount was last reset; it resets every 30 days
    promptCountResetAt: {
        type: Date,
    },

})

export default mongoose.model('user', userSchema);