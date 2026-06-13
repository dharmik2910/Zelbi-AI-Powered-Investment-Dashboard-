import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import mailSender from "../utils/mailSender.js";

export const resetPasswordToken = async (req, res) => {
	try {
		const email = req.body.email;
		const user = await User.findOne({ email: email });
		if (!user) {
			return res.json({
				success: false,
				message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
			});
		}
		const token = crypto.randomBytes(20).toString("hex");

		const updatedDetails = await User.findOneAndUpdate(
			{ email: email },
			{
				token: token,
				resetPasswordExpires: Date.now() + 3600000,
			},
			{ new: true }
		);
		console.log("DETAILS", updatedDetails);

		const url = `${process.env.FRONTEND_URL}/update-password/${token}`;

		// await mailSender(
		// 	email,
		// 	"Password Reset",
		// 	`Your Link for email verification is ${url}. Please click this url to reset your password.`
		// );
		const htmlTemplate = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
  <h2 style="color:#2563eb">Reset Your Password</h2>

  <p>We received a request to reset your password.</p>

  <a href="${url}"
     style="
       background:#2563eb;
       color:white;
       padding:12px 24px;
       text-decoration:none;
       border-radius:5px;
       display:inline-block;
     ">
     Reset Password
  </a>

  <p style="margin-top:20px">
    This link will expire in 1 hour.
  </p>

  <p>If you didn't request this, you can safely ignore this email.</p>
</div>
`;

		await mailSender(
			email,
			"Password Reset",
			htmlTemplate
		);

		res.json({
			success: true,
			message:
				"Email Sent Successfully, Please Check Your Email to Continue Further",
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Sending the Reset Message`,
		});
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { password, confirmPassword, token } = req.body;

		if (confirmPassword !== password) {
			return res.json({
				success: false,
				message: "Password and Confirm Password Does not Match",
			});
		}
		const userDetails = await User.findOne({ token: token });
		if (!userDetails) {
			return res.json({
				success: false,
				message: "Token is Invalid",
			});
		}
		if (!(userDetails.resetPasswordExpires > Date.now())) {
			return res.status(403).json({
				success: false,
				message: `Token is Expired, Please Regenerate Your Token`,
			});
		}
		const encryptedPassword = await bcrypt.hash(password, 10);
		await User.findOneAndUpdate(
			{ token: token },
			{ password: encryptedPassword },
			{ new: true }
		);
		res.json({
			success: true,
			message: `Password Reset Successful`,
		});
	} catch (error) {
		return res.json({
			error: error.message,
			success: false,
			message: `Some Error in Updating the Password`,
		});
	}
};