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
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: `Something Went Wrong While Validating the Token`,
		});
	}
};
