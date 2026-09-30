import mongoose from "mongoose";
import Alert from "../models/Alert.js";
import User from "../models/User.js";
import { getQuote, SYMBOL_PATTERN } from "../services/marketData.service.js";
import { getAlertLimit, refreshSubscriptionState } from "../utils/subscription.js";

export const getAlerts = async (req, res) => {
    try {
        const alerts = await Alert.find({ userId: req.user.id }).sort({ status: 1, createdAt: -1 }).lean();
        const user = await refreshSubscriptionState(await User.findById(req.user.id));
        const limit = getAlertLimit(user?.subscriptionPlan);

        return res.status(200).json({
            success: true,
            alerts,
            alertLimit: limit === Infinity ? -1 : limit,
        });
    } catch (err) {
        console.error("Error in getAlerts:", err);
        return res.status(500).json({ success: false, error: "Failed to load alerts" });
    }
};

export const createAlert = async (req, res) => {
    try {
        const symbol = String(req.body.symbol || "").trim().toUpperCase();
        const { condition } = req.body;
        const targetPrice = Number(req.body.targetPrice);

        if (!SYMBOL_PATTERN.test(symbol)) {
            return res.status(400).json({ success: false, error: "Invalid symbol" });
        }
        if (!["above", "below"].includes(condition)) {
            return res.status(400).json({ success: false, error: "Condition must be above or below" });
        }
        if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
            return res.status(400).json({ success: false, error: "Target price must be a positive number" });
        }

        const user = await refreshSubscriptionState(await User.findById(req.user.id));
        const limit = getAlertLimit(user?.subscriptionPlan);
        const activeCount = await Alert.countDocuments({ userId: req.user.id, status: "active" });
        if (activeCount >= limit) {
            return res.status(403).json({
                success: false,
                error: `Your plan allows ${limit} active alerts. Delete one or upgrade for more.`,
            });
        }

        const quote = await getQuote(symbol);
        if (!quote) {
            return res.status(404).json({ success: false, error: `Couldn't find market data for ${symbol}` });
        }

        // An alert that is already true would fire straight away, which is almost always a typo
        if (
            (condition === "above" && quote.price >= targetPrice) ||
            (condition === "below" && quote.price <= targetPrice)
        ) {
            return res.status(400).json({
                success: false,
                error: `${symbol} is already ${condition} ${targetPrice} (now ${quote.price}).`,
            });
        }

        const alert = await Alert.create({
            userId: req.user.id,
            symbol,
            condition,
            targetPrice,
            currency: quote.currency,
            note: req.body.note ? String(req.body.note).slice(0, 200) : undefined,
        });

        return res.status(201).json({ success: true, alert, currentPrice: quote.price });
    } catch (err) {
        console.error("Error in createAlert:", err);
        return res.status(500).json({ success: false, error: "Failed to create alert" });
    }
};

export const deleteAlert = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, error: "Alert not found" });
        }

        const result = await Alert.deleteOne({ _id: req.params.id, userId: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: "Alert not found" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error in deleteAlert:", err);
        return res.status(500).json({ success: false, error: "Failed to delete alert" });
    }
};
