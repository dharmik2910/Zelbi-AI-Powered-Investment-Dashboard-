// Grants or removes admin access from the command line.
// Usage: npm run make-admin -- someone@example.com
//        npm run make-admin -- someone@example.com --remove
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";

dotenv.config();

const email = process.argv[2];
const remove = process.argv.includes("--remove");

if (!email || email.startsWith("--")) {
    console.error("Usage: npm run make-admin -- <email> [--remove]");
    process.exit(1);
}

try {
    await mongoose.connect(process.env.MONGO_URI);
    const user = await User.findOneAndUpdate(
        // Emails are stored as typed, so match without regard to case
        { email: new RegExp(`^${email.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
        { role: remove ? "user" : "admin" },
        { new: true }
    );

    if (!user) {
        console.error(`No user found with email ${email}. Sign up on the site first.`);
        process.exitCode = 1;
    } else {
        console.log(`${user.email} is now ${user.role === "admin" ? "an admin" : "a regular user"}.`);
    }
} catch (err) {
    console.error("Failed:", err.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
