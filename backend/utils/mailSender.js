import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const mailSender = async (email, title, body) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Verify SMTP connection
    await transporter.verify();
    console.log("SMTP Connected Successfully");

    const info = await transporter.sendMail({
      from: `"Zelbi" <${process.env.MAIL_USER}>`,
      to: email,
      subject: title,
      html: body,
    });

    console.log("Email Sent:", info.messageId);

    return info;
  } catch (error) {
    console.error("Email Sending Error:", error);

    throw new Error(error.message);
  }
};

export default mailSender;
