import mongoose from "mongoose";
import AdminAuditLog from "../models/AdminAuditLog.js";
import Alert from "../models/Alert.js";
import Payment from "../models/Payment.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { PLANS } from "../config/plans.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 20;
const VALID_PLANS = PLANS.map((p) => p.id);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pageParams = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    return { page, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
};

const USER_LIST_FIELDS = "firstName lastName email role subscriptionPlan subscriptionExpiry aiPromptCount googleId createdAt image";

export const getStats = async (req, res) => {
    try {
        const now = Date.now();
        const since30 = new Date(now - 30 * DAY_MS);
        const since7 = new Date(now - 7 * DAY_MS);

        const [
            totalUsers,
            newUsers7,
            newUsers30,
            planCounts,
            revenue,
            revenue30,
            failedPayments30,
            promptUsage,
            usersWithTrades,
            activeAlerts,
            signupsByDay,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ _id: { $gte: mongoose.Types.ObjectId.createFromTime(since7.getTime() / 1000) } }),
            User.countDocuments({ _id: { $gte: mongoose.Types.ObjectId.createFromTime(since30.getTime() / 1000) } }),
            User.aggregate([
                {
                    $group: {
                        _id: {
                            $cond: [
                                { $and: [{ $ne: ["$subscriptionPlan", "free"] }, { $gt: ["$subscriptionExpiry", new Date()] }] },
                                "$subscriptionPlan",
                                "free",
                            ],
                        },
                        count: { $sum: 1 },
                    },
                },
            ]),
            Payment.aggregate([
                { $match: { status: "success" } },
                { $group: { _id: "$currency", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
            ]),
            Payment.aggregate([
                { $match: { status: "success", createdAt: { $gte: since30 } } },
                { $group: { _id: "$currency", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
            ]),
            Payment.countDocuments({ status: "failed", createdAt: { $gte: since30 } }),
            User.aggregate([{ $group: { _id: null, total: { $sum: "$aiPromptCount" } } }]),
            Transaction.distinct("userId").then((ids) => ids.length),
            Alert.countDocuments({ status: "active" }),
            // ObjectIds encode creation time, which also covers users created before timestamps existed
            User.aggregate([
                { $match: { _id: { $gte: mongoose.Types.ObjectId.createFromTime(since30.getTime() / 1000) } } },
                { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$_id" } } }, count: { $sum: 1 } } },
                { $sort: { _id: 1 } },
            ]),
        ]);

        // Payment amounts are stored in the smallest currency unit (paise)
        const toMajor = (rows) => rows.map((r) => ({ currency: r._id || "INR", amount: r.amount / 100, count: r.count }));

        return res.status(200).json({
            success: true,
            stats: {
                users: { total: totalUsers, new7Days: newUsers7, new30Days: newUsers30 },
                plans: Object.fromEntries(VALID_PLANS.map((id) => [id, planCounts.find((p) => p._id === id)?.count || 0])),
                revenue: { allTime: toMajor(revenue), last30Days: toMajor(revenue30) },
                failedPayments30Days: failedPayments30,
                aiPromptsThisCycle: promptUsage[0]?.total || 0,
                usersWithTrades,
                activeAlerts,
                signupsByDay: signupsByDay.map((d) => ({ date: d._id, count: d.count })),
            },
        });
    } catch (err) {
        console.error("Error in admin getStats:", err);
        return res.status(500).json({ success: false, message: "Could not load stats" });
    }
};

export const listUsers = async (req, res) => {
    try {
        const { page, skip, limit } = pageParams(req.query);
        const filter = {};

        const q = String(req.query.q || "").trim().slice(0, 100);
        if (q) {
            const pattern = new RegExp(escapeRegex(q), "i");
            filter.$or = [{ email: pattern }, { firstName: pattern }, { lastName: pattern }];
        }
        if (VALID_PLANS.includes(req.query.plan)) {
            filter.subscriptionPlan = req.query.plan;
        }
        if (req.query.role === "admin") {
            filter.role = "admin";
        }

        const [users, total] = await Promise.all([
            User.find(filter).select(USER_LIST_FIELDS).sort({ _id: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            users: users.map((u) => ({ ...u, createdAt: u.createdAt || u._id.getTimestamp() })),
            page,
            pages: Math.max(1, Math.ceil(total / limit)),
            total,
        });
    } catch (err) {
        console.error("Error in admin listUsers:", err);
        return res.status(500).json({ success: false, message: "Could not load users" });
    }
};

export const getUser = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = await User.findById(req.params.id)
            .select(`${USER_LIST_FIELDS} acceptedTerms acceptedTermsAt promptCountResetAt watchlist`)
            .populate("additionalDetails", "gender dateOfBirth about contactNumber")
            .lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const [payments, tradeCount, symbols, alerts] = await Promise.all([
            Payment.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).select("-razorpay_signature -__v").lean(),
            Transaction.countDocuments({ userId: user._id }),
            Transaction.distinct("symbol", { userId: user._id }),
            Alert.countDocuments({ userId: user._id, status: "active" }),
        ]);

        return res.status(200).json({
            success: true,
            user: { ...user, createdAt: user._id.getTimestamp() },
            activity: { tradeCount, symbolsTraded: symbols.length, activeAlerts: alerts },
            payments,
        });
    } catch (err) {
        console.error("Error in admin getUser:", err);
        return res.status(500).json({ success: false, message: "Could not load user" });
    }
};

export const updateUser = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { subscriptionPlan, subscriptionExpiry, resetPrompts, role } = req.body;
        const before = {};
        const after = {};
        const set = (field, value) => {
            before[field] = user[field] ?? null;
            user[field] = value;
            after[field] = value ?? null;
        };

        if (subscriptionPlan !== undefined) {
            if (!VALID_PLANS.includes(subscriptionPlan)) {
                return res.status(400).json({ success: false, message: "Invalid plan" });
            }
            set("subscriptionPlan", subscriptionPlan);
            if (subscriptionPlan === "free") set("subscriptionExpiry", null);
        }

        if (subscriptionExpiry !== undefined && user.subscriptionPlan !== "free") {
            const expiry = new Date(subscriptionExpiry);
            if (!subscriptionExpiry || Number.isNaN(expiry.getTime()) || expiry <= new Date()) {
                return res.status(400).json({ success: false, message: "Expiry must be a future date" });
            }
            set("subscriptionExpiry", expiry);
        }

        // A paid plan without an expiry would be downgraded on the next check, so default to 30 days
        if (user.subscriptionPlan !== "free" && !user.subscriptionExpiry) {
            set("subscriptionExpiry", new Date(Date.now() + 30 * DAY_MS));
        }

        if (resetPrompts) {
            set("aiPromptCount", 0);
            set("promptCountResetAt", new Date());
        }

        if (role !== undefined) {
            if (!["user", "admin"].includes(role)) {
                return res.status(400).json({ success: false, message: "Invalid role" });
            }
            if (String(user._id) === req.admin.id && role !== "admin") {
                return res.status(400).json({ success: false, message: "You can't remove your own admin access" });
            }
            set("role", role);
        }

        if (Object.keys(after).length === 0) {
            return res.status(400).json({ success: false, message: "Nothing to update" });
        }

        await user.save();
        await AdminAuditLog.create({
            adminId: req.admin.id,
            adminEmail: req.admin.email,
            action: "update_user",
            targetUserId: user._id,
            targetEmail: user.email,
            details: { before, after },
        });

        const updated = await User.findById(user._id).select(USER_LIST_FIELDS).lean();
        return res.status(200).json({ success: true, user: updated });
    } catch (err) {
        console.error("Error in admin updateUser:", err);
        return res.status(500).json({ success: false, message: "Could not update user" });
    }
};

export const listPayments = async (req, res) => {
    try {
        const { page, skip, limit } = pageParams(req.query);
        const filter = {};
        if (["success", "failed"].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const [payments, total] = await Promise.all([
            Payment.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .select("-razorpay_signature -__v")
                .populate("userId", "email firstName lastName")
                .lean(),
            Payment.countDocuments(filter),
        ]);

        return res.status(200).json({ success: true, payments, page, pages: Math.max(1, Math.ceil(total / limit)), total });
    } catch (err) {
        console.error("Error in admin listPayments:", err);
        return res.status(500).json({ success: false, message: "Could not load payments" });
    }
};

export const listAuditLog = async (req, res) => {
    try {
        const { page, skip, limit } = pageParams(req.query);
        const [entries, total] = await Promise.all([
            AdminAuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            AdminAuditLog.countDocuments(),
        ]);
        return res.status(200).json({ success: true, entries, page, pages: Math.max(1, Math.ceil(total / limit)), total });
    } catch (err) {
        console.error("Error in admin listAuditLog:", err);
        return res.status(500).json({ success: false, message: "Could not load activity log" });
    }
};
