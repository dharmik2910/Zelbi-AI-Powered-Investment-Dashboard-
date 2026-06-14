import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const mailSender = async (email, title, body) => {
    try {
        const response = await axios.post(
            "https://api.brevo.com/v3/smtp/email",
            {
                sender: {
                    name: "Zelbi",
                    email: "djrabadiya2910@gmail.com",
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
        return response.data;
    } catch (error) {
        console.error(
            "❌ Email Error:",
            error.response?.data || error.message
        );
        throw error;
    }
};

export default mailSender;