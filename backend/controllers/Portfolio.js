import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import { matchLots, OversellError, summarizePositions } from "../services/lots.service.js";
import { getQuote, SYMBOL_PATTERN } from "../services/marketData.service.js";
import {
    getCapitalGains,
    getUserTrades,
    getValuedPortfolio,
    inferCurrency,
} from "../services/portfolio.service.js";
import { getHoldingLimit, refreshSubscriptionState } from "../utils/subscription.js";

const MAX_IMPORT_ROWS = 2000;
const FY_PATTERN = /^\d{4}-\d{2}$/;

/**
 * Validates trade fields. With `partial`, only fields present in the body are checked.
 * @returns {{ data: Object, errors: string[] }}
 */
const parseTrade = (body, { partial = false } = {}) => {
    const errors = [];
    const data = {};

    if (!partial || body.symbol !== undefined) {
        const symbol = String(body.symbol || "").trim().toUpperCase();
        if (!SYMBOL_PATTERN.test(symbol)) errors.push("Invalid symbol");
        else data.symbol = symbol;
    }

    if (!partial || body.type !== undefined) {
        if (!["buy", "sell"].includes(body.type)) errors.push("Type must be buy or sell");
        else data.type = body.type;
    }

    if (!partial || body.quantity !== undefined) {
        const quantity = Number(body.quantity);
        if (!Number.isFinite(quantity) || quantity <= 0) errors.push("Quantity must be a positive number");
        else data.quantity = quantity;
    }

    if (!partial || body.price !== undefined) {
        const price = Number(body.price);
        if (!Number.isFinite(price) || price < 0) errors.push("Price must be zero or more");
        else data.price = price;
    }

    if (body.fees !== undefined && body.fees !== "") {
        const fees = Number(body.fees);
        if (!Number.isFinite(fees) || fees < 0) errors.push("Fees must be zero or more");
        else data.fees = fees;
    }

    if (!partial || body.date !== undefined) {
        const date = new Date(body.date);
        if (!body.date || Number.isNaN(date.getTime())) errors.push("Date is required");
        else if (date > new Date()) errors.push("Date can't be in the future");
        else data.date = date;
    }

    if (body.notes !== undefined) {
        data.notes = String(body.notes).slice(0, 500);
    }

    return { data, errors };
};

// Throws OversellError if the trades don't add up
const assertValidTrades = (trades) => matchLots(trades);

const openSymbols = (trades) => new Set(summarizePositions(matchLots(trades).openLots).map((p) => p.symbol));

// Only blocks changes that add holdings, so users over the limit after a downgrade can still sell
const checkHoldingLimit = async (userId, before, after) => {
    const user = await refreshSubscriptionState(await User.findById(userId));
    const limit = getHoldingLimit(user?.subscriptionPlan);
    const count = openSymbols(after).size;
    if (count > limit && count > openSymbols(before).size) {
        return `Your plan allows ${limit} holdings. Upgrade to Pro to track more.`;
    }
    return null;
};

const handleTradeError = (res, err, label) => {
    if (err instanceof OversellError) {
        return res.status(400).json({ success: false, error: err.message });
    }
    console.error(`Error in ${label}:`, err);
    return res.status(500).json({ success: false, error: "Something went wrong. Please try again." });
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
        return handleTradeError(res, err, "getPortfolio");
    }
};

export const listTransactions = async (req, res) => {
    try {
        const trades = await getUserTrades(req.user.id);
        const symbol = req.query.symbol ? String(req.query.symbol).toUpperCase() : null;
        const filtered = symbol ? trades.filter((t) => t.symbol === symbol) : trades;
        return res.status(200).json({ success: true, transactions: filtered.reverse() });
    } catch (err) {
        return handleTradeError(res, err, "listTransactions");
    }
};

export const addTransaction = async (req, res) => {
    try {
        const { data, errors } = parseTrade(req.body);
        if (errors.length) {
            return res.status(400).json({ success: false, error: errors.join(". ") });
        }

        const trades = await getUserTrades(req.user.id);
        const previous = trades.find((t) => t.symbol === data.symbol);

        // Check new symbols against live data; reuse details for symbols already traded
        if (previous) {
            data.name = previous.name;
            data.currency = previous.currency;
        } else {
            const quote = await getQuote(data.symbol);
            if (!quote) {
                return res.status(404).json({ success: false, error: `Couldn't find market data for ${data.symbol}` });
            }
            data.name = quote.name;
            data.currency = quote.currency;
        }

        const candidate = { ...data, createdAt: new Date() };
        assertValidTrades([...trades.filter((t) => t.symbol === data.symbol), candidate]);

        const limitError = await checkHoldingLimit(req.user.id, trades, [...trades, candidate]);
        if (limitError) {
            return res.status(403).json({ success: false, error: limitError });
        }

        const transaction = await Transaction.create({ ...data, userId: req.user.id });
        return res.status(201).json({ success: true, transaction });
    } catch (err) {
        return handleTradeError(res, err, "addTransaction");
    }
};

export const updateTransaction = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, error: "Trade not found" });
        }

        // Symbol can't change; delete and re-add the trade instead
        const { symbol, ...body } = req.body;
        const { data, errors } = parseTrade(body, { partial: true });
        if (errors.length) {
            return res.status(400).json({ success: false, error: errors.join(". ") });
        }

        const trades = await getUserTrades(req.user.id);
        const existing = trades.find((t) => String(t._id) === req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: "Trade not found" });
        }

        const updated = { ...existing, ...data };
        const replay = trades.map((t) => (String(t._id) === req.params.id ? updated : t));
        assertValidTrades(replay.filter((t) => t.symbol === existing.symbol));

        const transaction = await Transaction.findOneAndUpdate(
            { _id: req.params.id, userId: req.user.id },
            data,
            { new: true }
        );
        return res.status(200).json({ success: true, transaction });
    } catch (err) {
        return handleTradeError(res, err, "updateTransaction");
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).json({ success: false, error: "Trade not found" });
        }

        const trades = await getUserTrades(req.user.id);
        const existing = trades.find((t) => String(t._id) === req.params.id);
        if (!existing) {
            return res.status(404).json({ success: false, error: "Trade not found" });
        }

        // Removing a buy can leave a later sell without shares to sell
        assertValidTrades(trades.filter((t) => t.symbol === existing.symbol && String(t._id) !== req.params.id));

        await Transaction.deleteOne({ _id: req.params.id, userId: req.user.id });
        return res.status(200).json({ success: true });
    } catch (err) {
        if (err instanceof OversellError) {
            return res.status(400).json({
                success: false,
                error: `Deleting this trade would break a later sell. ${err.message}`,
            });
        }
        return handleTradeError(res, err, "deleteTransaction");
    }
};

/**
 * Imports many trades at once. Either every row is valid and saved, or nothing is saved.
 * Rows aren't checked against live data, to stay within the market data rate limit.
 */
export const importTransactions = async (req, res) => {
    try {
        const rows = req.body.transactions;
        if (!Array.isArray(rows) || rows.length === 0) {
            return res.status(400).json({ success: false, error: "No trades to import" });
        }
        if (rows.length > MAX_IMPORT_ROWS) {
            return res.status(400).json({ success: false, error: `You can import up to ${MAX_IMPORT_ROWS} trades at a time` });
        }

        const rowErrors = [];
        const parsed = rows.map((row, index) => {
            const { data, errors } = parseTrade(row);
            if (errors.length) rowErrors.push(`Row ${index + 1}: ${errors.join(", ")}`);
            return { ...data, createdAt: new Date(Date.now() + index) };
        });
        if (rowErrors.length) {
            return res.status(400).json({ success: false, error: "Some rows are invalid", details: rowErrors.slice(0, 20) });
        }

        const trades = await getUserTrades(req.user.id);
        const known = Object.fromEntries(trades.map((t) => [t.symbol, t]));
        for (const trade of parsed) {
            trade.name = known[trade.symbol]?.name;
            trade.currency = known[trade.symbol]?.currency || inferCurrency(trade.symbol) || undefined;
        }

        const combined = [...trades, ...parsed];
        assertValidTrades(combined);

        const limitError = await checkHoldingLimit(req.user.id, trades, combined);
        if (limitError) {
            return res.status(403).json({ success: false, error: limitError });
        }

        await Transaction.insertMany(parsed.map(({ createdAt, ...trade }) => ({ ...trade, userId: req.user.id })));
        return res.status(201).json({ success: true, imported: parsed.length });
    } catch (err) {
        return handleTradeError(res, err, "importTransactions");
    }
};

export const getTaxSummary = async (req, res) => {
    try {
        const fy = req.query.fy ? String(req.query.fy) : undefined;
        if (fy && !FY_PATTERN.test(fy)) {
            return res.status(400).json({ success: false, error: "Financial year must look like 2025-26" });
        }

        const summary = await getCapitalGains(req.user.id, fy);
        return res.status(200).json({ success: true, ...summary });
    } catch (err) {
        return handleTradeError(res, err, "getTaxSummary");
    }
};
