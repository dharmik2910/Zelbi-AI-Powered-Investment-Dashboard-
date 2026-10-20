import axios from "axios";
import dotenv from "dotenv";
import EmailLog from "../models/EmailLog.js";
import User from "../models/User.js";

dotenv.config();

// Records the send for the admin email log. Logging must never break sending.
const logEmail = async (email, title, meta, result) => {
    try {
        let userId = meta.userId;
        if (!userId) {
            const user = await User.findOne({ email }).select("_id").lean();
            userId = user?._id;
        }
        await EmailLog.create({
            to: email,
            userId,
            type: meta.type || "other",
            subject: title,
            ...result,
        });
    } catch (logError) {
        console.error("Failed to write email log:", logError.message);
    }
};

/**
 * Sends an email through Brevo and logs it.
 * @param {string} email - Recipient
 * @param {string} title - Subject
 * @param {string} body - HTML content
 * @param {{ type?: string, userId?: string }} [meta] - For the admin email log
 */
const mailSender = async (email, title, body, meta = {}) => {
    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: "Zelbi",
                    email: process.env.MAIL_FROM || "djrabadiya2910@gmail.com",
                },
                to: [{ email }],
                subject: title,
                htmlContent: body,
            },
            {
                headers: {
                    accept: "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json",
                },
            }
        );

        console.log("✅ Email sent:", response.data);
        await logEmail(email, title, meta, { status: "sent", messageId: response.data?.messageId });
        return response.data;
    } catch (error) {
        const reason = error.response?.data?.message || error.message;
        console.error("❌ Email Error:", error.response?.data || error.message);
        await logEmail(email, title, meta, { status: "failed", error: String(reason).slice(0, 500) });
        throw error;
    }
};

export default mailSender;
