import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User.js";
dotenv.config();

export const auth = async (req, res, next) => {
	try {
		const token =
			(req.header("Authorization") ? req.header("Authorization").replace("Bearer ", "") : null) ||
			req.cookies.token ||
			req.body.token;

		if (!token) {
			return res.status(401).json({ success: false, message: `Token Missing` });
		}

		try {
			const decode = await jwt.verify(token, process.env.JWT_SECRET);

			req.user = decode;
		} catch (error) {
			return res
				.status(401)
				.json({ success: false, message: "token is invalid" });
		}

		// Checked on every request so blocking or deleting an account takes effect immediately
		const account = await User.findById(req.user.id).select("isBlocked").lean();
		if (!account) {
			return res.status(401).json({ success: false, message: "Account not found" });
		}
		if (account.isBlocked) {
			return res.status(403).json({ success: false, blocked: true, message: "Your account has been suspended. Contact support." });
		}
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
	}
};
