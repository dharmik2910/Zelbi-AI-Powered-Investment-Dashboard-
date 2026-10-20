import User from "../models/User.js";

// Use after `auth`. Checks the role in the database rather than the token,
// so removing someone's admin role takes effect immediately.
export const isAdmin = async (req, res, next) => {
	try {
		const user = await User.findById(req.user.id).select("role email");
		if (!user || user.role !== "admin") {
			return res.status(403).json({ success: false, message: "Admin access required" });
		}
		req.admin = { id: String(user._id), email: user.email };
		next();
	} catch (error) {
		console.error("Error in isAdmin:", error);
		return res.status(500).json({ success: false, message: "Could not verify admin access" });
	}
};
