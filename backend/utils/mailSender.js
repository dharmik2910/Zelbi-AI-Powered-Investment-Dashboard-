import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const mailSender = async (email, title, body) => {
  try {
    console.log("========== MAIL DEBUG ==========");
    console.log("MAIL_USER:", process.env.MAIL_USER);
    console.log("MAIL_PASS EXISTS:", !!process.env.MAIL_PASS);

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,
    });

    console.log("Verifying SMTP connection...");

    await transporter.verify();

    console.log("✅ SMTP Connected Successfully");

    const info = await transporter.sendMail({
      from: `"Zelbi" <${process.env.MAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("✅ Email Sent Successfully");
    console.log("Message ID:", info.messageId);

    return info;
  } catch (error) {
    console.error("❌ Email Sending Error:", error);
    throw error;
  }
};

export default mailSender;
