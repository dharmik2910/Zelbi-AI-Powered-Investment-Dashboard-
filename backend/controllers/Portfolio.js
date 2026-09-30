import mongoose from "mongoose";
import Holding from "../models/Holding.js";
import User from "../models/User.js";
import { getQuote, SYMBOL_PATTERN } from "../services/marketData.service.js";
import { getValuedPortfolio } from "../services/portfolio.service.js";
import { getHoldingLimit, refreshSubscriptionState } from "../utils/subscription.js";

const parseHoldingInput = (body, { partial = false } = {}) => {
    const errors = [];
    const data = {};

    if (!partial || body.quantity !== undefined) {
        const quantity = Number(body.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) errors.push("Quantity must be a positive number");
        else data.quantity = quantity;
    }

    if (!partial || body.avgPrice !== undefined) {
        const avgPrice = Number(body.avgPrice);
        if (!Number.isFinite(avgPrice) || avgPrice < 0) errors.push("Average price must be zero or more");
        else data.avgPrice = avgPrice;
    }

    if (body.buyDate) {
        const buyDate = new Date(body.buyDate);
        if (Number.isNaN(buyDate.getTime()) || buyDate > new Date()) errors.push("Buy date must be a past date");
        else data.buyDate = buyDate;
    }

    if (body.notes !== undefined) {
        data.notes = String(body.notes).slice(0, 500);
    }

    return { data, errors };
};

export const getPortfolio = async (req, res) => {
    try {
        const user = await refreshSubscriptionState(await User.findById(req.user.id));
        const portfolio = await getValuedPortfolio(req.user.id);
        const limit = getHoldingLimit(user?.subscriptionPlan);

        return res.status(200).json({
            success: true,
            ...portfolio,
            holdingLimit: limit === Infinity ? -1 : limit,
        });
    } catch (err) {
        console.error("Error in getPortfolio:", err);
        return res.status(500).json({ success: false, error: "Failed to load portfolio" });
    }
};

export const addHolding = async (req, res) => {
    try {
        const symbol = String(req.body.symbol || "").trim().toUpperCase();
        if (!SYMBOL_PATTERN.test(symbol)) {
            return res.status(400).json({ success: false, error: "Invalid symbol" });
        }

        const { data, errors } = parseHoldingInput(req.body);
        if (errors.length) {
            return res.status(400).json({ success: false, error: errors.join(". ") });
        }

        const user = await refreshSubscriptionState(await User.findById(req.user.id));
        const limit = getHoldingLimit(user?.subscriptionPlan);
        const count = await Holding.countDocuments({ userId: req.user.id });
        if (count >= limit) {
            return res.status(403).json({
                success: false,
                error: `Your plan allows ${limit} holdings. Upgrade to Pro to track more.`,
            });
        }

        const quote = await getQuote(symbol);
        if (!quote) {
            return res.status(404).json({ success: false, error: `Couldn't find market data for ${symbol}` });
        }

        const holding = await Holding.create({
            ...data,
            userId: req.user.id,
            symbol,
            name: quote.name,
        });

        return res.status(201).json({ success: true, holding });
    } catch (err) {
        console.error("Error in addHolding:", err);
        return res.status(500).json({ success: false, error: "Failed to add holding" });
    }
};

export const updateHolding = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, error: "Holding not found" });
        }

        const { data, errors } = parseHoldingInput(req.body, { partial: true });
        if (errors.length) {
            return res.status(400).json({ success: false, error: errors.join(". ") });
        }

        const holding = await Holding.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            data,
            { new: true }
        );
        if (!holding) {
            return res.status(404).json({ success: false, error: "Holding not found" });
        }

        return res.status(200).json({ success: true, holding });
    } catch (err) {
        console.error("Error in updateHolding:", err);
        return res.status(500).json({ success: false, error: "Failed to update holding" });
    }
};

export const deleteHolding = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, error: "Holding not found" });
        }

        const result = await Holding.deleteOne({ _id: req.params.id, userId: req.user.id });
        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, error: "Holding not found" });
        }

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error("Error in deleteHolding:", err);
        return res.status(500).json({ success: false, error: "Failed to delete holding" });
    }
};
