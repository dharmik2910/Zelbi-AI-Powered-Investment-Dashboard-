import mongoose from "mongoose";

const userSchema=new mongoose.Schema({

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
        required: true,
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

})

export default mongoose.model('user',userSchema);