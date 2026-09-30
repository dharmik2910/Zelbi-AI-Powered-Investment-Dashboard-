import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User.js";
import mailSender from "../utils/mailSender.js";
import baseEmailTemplate from "../mail/templates/baseEmailTemplate.js";

export const resetPasswordToken = async (req, res) => {
	try {
		const email = req.body.email;
		// Never build the link from client input, or it could point at an attacker's site
		const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3001";
		const user = await User.findOne({ email: email });
		if (!user) {
			return res.status(404).json({
				success: false,
				message: `This Email: ${email} is not Registered With Us Enter a Valid Email `,
			});
		}
		const token = crypto.randomBytes(20).toString("hex");

		await User.findOneAndUpdate(
			{ email: email },
			{
				token: token,
				resetPasswordExpires: Date.now() + 3600000,
			}
		);

		const url = `${frontendUrl.replace(/\/$/, "")}/update-password/${token}`;


		// await mailSender(
		// 	email,
		// 	"Password Reset",
		// 	`Your Link for email verification is ${url}. Please click this url to reset your password.`
		// );
		const htmlTemplate = baseEmailTemplate({
			title: "Reset Your Password",
			eyebrow: "Account Recovery",
			heading: "Reset Your Password",
			body: `
				<p style="margin:0 0 15px;">We received a request to reset your password.</p>
				<p style="margin:0 0 15px;">Click the button below to choose a new password.</p>
				<p style="margin:0;">This link will expire in 1 hour.</p>
			`,
			ctaText: "Reset Password",
			ctaUrl: url,
			footerNote: "If you did not request this, you can safely ignore this email.",
		});

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
		console.error("Error in resetPasswordToken:", error);
		return res.status(500).json({
			success: false,
			message: `Some Error in Sending the Reset Message`,
		});
	}
};

export const resetPassword = async (req, res) => {
	try {
		const { password, confirmPassword, token } = req.body;

		if (!password || !token) {
			return res.status(400).json({
				success: false,
				message: "All fields are required",
			});
		}
		if (confirmPassword !== password) {
			return res.status(400).json({
				success: false,
				message: "Password and Confirm Password Does not Match",
			});
		}
		const userDetails = await User.findOne({ token: token });
		if (!userDetails) {
			return res.status(400).json({
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
		// Clear the token so the reset link can't be used again
		await User.findOneAndUpdate(
			{ token: token },
			{
				password: encryptedPassword,
				$unset: { token: 1, resetPasswordExpires: 1 },
			}
		);
		res.json({
			success: true,
			message: `Password Reset Successful`,
		});
	} catch (error) {
		console.error("Error in resetPassword:", error);
		return res.status(500).json({
			success: false,
			message: `Some Error in Updating the Password`,
		});
	}
};
