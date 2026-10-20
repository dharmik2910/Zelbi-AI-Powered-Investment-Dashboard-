import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import baseEmailTemplate from "../mail/templates/baseEmailTemplate.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import Alert from "../models/Alert.js";
import Holding from "../models/Holding.js";
import Payment from "../models/Payment.js";
import Profile from "../models/Profile.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { PLANS } from "../config/plans.js";
import mailSender from "../utils/mailSender.js";
import { deleteFile } from "../utils/s3Uploader.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_SIZE = 20;
const VALID_PLANS = PLANS.map((p) => p.id);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pageParams = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    return { page, skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
};

const USER_LIST_FIELDS = "firstName lastName email role isBlocked subscriptionPlan subscriptionExpiry aiPromptCount googleId createdAt image";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;
const MAX_EXPORT_ROWS = 10000;

const emailTaken = (email, exceptId) =>
    User.exists({
        email: new RegExp(`^${escapeRegex(email)}$`, "i"),
        ...(exceptId ? { _id: { $ne: exceptId } } : {}),
    });

const logAction = (req, action, target, details) =>
    AdminAuditLog.create({
        adminId: req.admin.id,
        adminEmail: req.admin.email,
        action,
        targetUserId: target?._id,
        targetEmail: target?.email,
        details,
    });

const csvCell = (value) => {
    const text = value === null || value === undefined ? "" : String(value);
    // Stop spreadsheet apps running cells as formulas
    const safe = /^[=+\-@\t\r]/.test(text) && !/^-?\d/.test(text) ? `'${text}` : text;
    return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

const sendCsv = (res, filename, header, rows) => {
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
};

/**
 * Emails a link to set a new password. Invites get a longer-lived link than resets.
 */
const sendPasswordLink = async (user, { invite = false } = {}) => {
    const token = crypto.randomBytes(20).toString("hex");
    const expiresInMs = invite ? 7 * DAY_MS : 60 * 60 * 1000;
    await User.updateOne({ _id: user._id }, { token, resetPasswordExpires: Date.now() + expiresInMs });

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3001").replace(/\/$/, "");
    const html = baseEmailTemplate({
        title: invite ? "Welcome to Zelbi" : "Reset Your Password",
        eyebrow: invite ? "Account Created" : "Account Recovery",
        heading: invite ? "Set up your Zelbi account" : "Reset Your Password",
        body: invite
            ? `<p style="margin:0 0 15px;">An account has been created for you on Zelbi.</p>
               <p style="margin:0 0 15px;">Click the button below to choose your password and sign in.</p>
               <p style="margin:0;">This link expires in 7 days.</p>`
            : `<p style="margin:0 0 15px;">A password reset was requested for your account.</p>
               <p style="margin:0 0 15px;">Click the button below to choose a new password.</p>
               <p style="margin:0;">This link expires in 1 hour.</p>`,
        ctaText: invite ? "Set Password" : "Reset Password",
        ctaUrl: `${frontendUrl}/update-password/${token}`,
        footerNote: "If you weren't expecting this email, you can safely ignore it.",
    });

    await mailSender(user.email, invite ? "Your Zelbi account" : "Password Reset", html);
};

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
        if (req.query.status === "blocked") {
            filter.isBlocked = true;
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

        const [payments, tradeCount, symbols, trades, alerts] = await Promise.all([
            Payment.find({ userId: user._id }).sort({ createdAt: -1 }).limit(50).select("-razorpay_signature -__v").lean(),
            Transaction.countDocuments({ userId: user._id }),
            Transaction.distinct("symbol", { userId: user._id }),
            Transaction.find({ userId: user._id }).sort({ date: -1, createdAt: -1 }).limit(25).lean(),
            Alert.find({ userId: user._id }).sort({ status: 1, createdAt: -1 }).limit(100).lean(),
        ]);

        return res.status(200).json({
            success: true,
            user: { ...user, createdAt: user._id.getTimestamp() },
            activity: {
                tradeCount,
                symbolsTraded: symbols.length,
                activeAlerts: alerts.filter((a) => a.status === "active").length,
            },
            trades,
            alerts,
            payments,
        });
    } catch (err) {
        console.error("Error in admin getUser:", err);
        return res.status(500).json({ success: false, message: "Could not load user" });
    }
};

export const createUser = async (req, res) => {
    try {
        const firstName = String(req.body.firstName || "").trim().slice(0, 50);
        const lastName = String(req.body.lastName || "").trim().slice(0, 50);
        const email = String(req.body.email || "").trim();
        const { password, subscriptionPlan = "free", subscriptionExpiry, role = "user" } = req.body;

        if (!firstName || !EMAIL_PATTERN.test(email)) {
            return res.status(400).json({ success: false, message: "First name and a valid email are required" });
        }
        if (password && String(password).length < MIN_PASSWORD_LENGTH) {
            return res.status(400).json({ success: false, message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` });
        }
        if (!VALID_PLANS.includes(subscriptionPlan) || !["user", "admin"].includes(role)) {
            return res.status(400).json({ success: false, message: "Invalid plan or role" });
        }
        if (await emailTaken(email)) {
            return res.status(409).json({ success: false, message: "A user with this email already exists" });
        }

        let expiry = null;
        if (subscriptionPlan !== "free") {
            expiry = subscriptionExpiry ? new Date(subscriptionExpiry) : new Date(Date.now() + 30 * DAY_MS);
            if (Number.isNaN(expiry.getTime()) || expiry <= new Date()) {
                return res.status(400).json({ success: false, message: "Expiry must be a future date" });
            }
        }

        const profile = await Profile.create({ gender: null, dateOfBirth: null, about: null, contactNumber: null });
        // Users without a password get an emailed link; the random hash keeps the account locked until then
        const hashed = await bcrypt.hash(password ? String(password) : crypto.randomBytes(32).toString("hex"), 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            password: hashed,
            additionalDetails: profile._id,
            role,
            subscriptionPlan,
            subscriptionExpiry: expiry,
            acceptedTerms: false,
        });

        let inviteSent = false;
        if (!password) {
            try {
                await sendPasswordLink(user, { invite: true });
                inviteSent = true;
            } catch (mailErr) {
                console.error("Failed to send invite email:", mailErr.message);
            }
        }

        await logAction(req, "create_user", user, { after: { firstName, lastName, email, role, subscriptionPlan, subscriptionExpiry: expiry } });

        const created = await User.findById(user._id).select(USER_LIST_FIELDS).lean();
        return res.status(201).json({ success: true, user: created, inviteSent });
    } catch (err) {
        console.error("Error in admin createUser:", err);
        return res.status(500).json({ success: false, message: "Could not create user" });
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

        const isSelf = String(user._id) === req.admin.id;
        const { firstName, lastName, email, subscriptionPlan, subscriptionExpiry, resetPrompts, role, isBlocked } = req.body;
        const before = {};
        const after = {};
        const set = (field, value) => {
            before[field] = user[field] ?? null;
            user[field] = value;
            after[field] = value ?? null;
        };

        if (firstName !== undefined) {
            const value = String(firstName).trim().slice(0, 50);
            if (!value) return res.status(400).json({ success: false, message: "First name can't be empty" });
            if (value !== user.firstName) set("firstName", value);
        }
        if (lastName !== undefined) {
            const value = String(lastName).trim().slice(0, 50);
            if (value !== (user.lastName || "")) set("lastName", value);
        }
        if (email !== undefined) {
            const value = String(email).trim();
            if (!EMAIL_PATTERN.test(value)) {
                return res.status(400).json({ success: false, message: "Invalid email" });
            }
            if (value.toLowerCase() !== user.email.toLowerCase()) {
                if (await emailTaken(value, user._id)) {
                    return res.status(409).json({ success: false, message: "Another user already has this email" });
                }
                set("email", value);
            }
        }

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
            if (isSelf && role !== "admin") {
                return res.status(400).json({ success: false, message: "You can't remove your own admin access" });
            }
            set("role", role);
        }

        if (isBlocked !== undefined) {
            if (isSelf && isBlocked) {
                return res.status(400).json({ success: false, message: "You can't block yourself" });
            }
            set("isBlocked", Boolean(isBlocked));
        }

        if (Object.keys(after).length === 0) {
            return res.status(400).json({ success: false, message: "Nothing to update" });
        }

        await user.save();
        const action = isBlocked !== undefined && Object.keys(after).length === 1
            ? (isBlocked ? "block_user" : "unblock_user")
            : "update_user";
        await logAction(req, action, user, { before, after });

        const updated = await User.findById(user._id).select(USER_LIST_FIELDS).lean();
        return res.status(200).json({ success: true, user: updated });
    } catch (err) {
        console.error("Error in admin updateUser:", err);
        return res.status(500).json({ success: false, message: "Could not update user" });
    }
};

export const sendUserPasswordReset = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const user = await User.findById(req.params.id).select("email");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        await sendPasswordLink(user);
        await logAction(req, "send_password_reset", user);
        return res.status(200).json({ success: true, message: `Password reset email sent to ${user.email}` });
    } catch (err) {
        console.error("Error in admin sendUserPasswordReset:", err);
        return res.status(500).json({ success: false, message: "Could not send the reset email" });
    }
};

export const deleteUser = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (String(user._id) === req.admin.id) {
            return res.status(400).json({ success: false, message: "You can't delete your own account here" });
        }
        if (user.role === "admin") {
            return res.status(400).json({ success: false, message: "Remove this user's admin role before deleting them" });
        }
        // The client must repeat the email, as a guard against deleting the wrong account
        if (String(req.body?.confirmEmail || "").trim().toLowerCase() !== user.email.toLowerCase()) {
            return res.status(400).json({ success: false, message: "Type the user's email to confirm deletion" });
        }

        if (user.image) {
            await deleteFile(user.image).catch((err) => console.error("Failed to delete profile image:", err.message));
        }

        const [trades, alerts, holdings] = await Promise.all([
            Transaction.deleteMany({ userId: user._id }),
            Alert.deleteMany({ userId: user._id }),
            Holding.deleteMany({ userId: user._id }),
        ]);
        if (user.additionalDetails) {
            await Profile.deleteOne({ _id: user.additionalDetails });
        }
        await User.deleteOne({ _id: user._id });

        // Payment records are kept for accounting
        await logAction(req, "delete_user", user, {
            removed: { trades: trades.deletedCount, alerts: alerts.deletedCount, holdings: holdings.deletedCount },
        });

        return res.status(200).json({ success: true, message: `${user.email} was deleted` });
    } catch (err) {
        console.error("Error in admin deleteUser:", err);
        return res.status(500).json({ success: false, message: "Could not delete user" });
    }
};

export const deleteUserAlert = async (req, res) => {
    try {
        const { id, alertId } = req.params;
        if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(alertId)) {
            return res.status(404).json({ success: false, message: "Alert not found" });
        }

        const alert = await Alert.findOneAndDelete({ _id: alertId, userId: id }).lean();
        if (!alert) {
            return res.status(404).json({ success: false, message: "Alert not found" });
        }

        const user = await User.findById(id).select("email").lean();
        await logAction(req, "delete_alert", user || { _id: id }, {
            alert: { symbol: alert.symbol, condition: alert.condition, targetPrice: alert.targetPrice },
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error in admin deleteUserAlert:", err);
        return res.status(500).json({ success: false, message: "Could not delete alert" });
    }
};

export const exportUsers = async (req, res) => {
    try {
        const users = await User.find().select(USER_LIST_FIELDS).sort({ _id: -1 }).limit(MAX_EXPORT_ROWS).lean();
        const rows = users.map((u) => [
            u.firstName, u.lastName, u.email, u.role || "user", u.isBlocked ? "blocked" : "active",
            u.subscriptionPlan || "free",
            u.subscriptionExpiry ? new Date(u.subscriptionExpiry).toISOString().slice(0, 10) : "",
            u.aiPromptCount || 0, u.googleId ? "google" : "email",
            u._id.getTimestamp().toISOString().slice(0, 10),
        ]);
        return sendCsv(res, "zelbi-users.csv",
            ["first_name", "last_name", "email", "role", "status", "plan", "plan_expiry", "ai_prompts", "sign_in", "joined"], rows);
    } catch (err) {
        console.error("Error in admin exportUsers:", err);
        return res.status(500).json({ success: false, message: "Could not export users" });
    }
};

export const exportPayments = async (req, res) => {
    try {
        const payments = await Payment.find()
            .sort({ createdAt: -1 })
            .limit(MAX_EXPORT_ROWS)
            .populate("userId", "email")
            .lean();
        const rows = payments.map((p) => [
            new Date(p.createdAt).toISOString(), p.userId?.email || "deleted user", p.plan, p.billingCycle,
            (p.amount / 100).toFixed(2), p.currency, p.status, p.razorpay_order_id, p.razorpay_payment_id,
        ]);
        return sendCsv(res, "zelbi-payments.csv",
            ["date", "email", "plan", "billing_cycle", "amount", "currency", "status", "order_id", "payment_id"], rows);
    } catch (err) {
        console.error("Error in admin exportPayments:", err);
        return res.status(500).json({ success: false, message: "Could not export payments" });
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
