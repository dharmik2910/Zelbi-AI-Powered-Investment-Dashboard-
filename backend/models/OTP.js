import mongoose from "mongoose";
import mailSender from "../utils/mailSender.js";
import emailTemplate from "../mail/templates/emailVerificationTemplate.js";

const OTPSchema = new mongoose.Schema({
	email: {
		type: String,
		required: true,
	},
	otp: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
		expires: 60 * 5,
	},
});

async function sendVerificationEmail(email, otp) {

	try {
		const mailResponse = await mailSender(
			email,
			"Verification Email",
			emailTemplate(otp),
			{ type: "otp" }
		);
		console.log("Email sent successfully: ", mailResponse.response);
	} catch (error) {
		console.log("Error occurred while sending email: ", error);
		throw error;
	}

}

OTPSchema.pre("save", async function (next) {
	console.log("New document saved to database");

	if (this.isNew) {
		await sendVerificationEmail(this.email, this.otp);
	}
	next();
});

export default mongoose.model("OTP",OTPSchema)