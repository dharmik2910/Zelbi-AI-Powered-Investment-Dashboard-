import Alert from "../models/Alert.js";
import User from "../models/User.js";
import baseEmailTemplate from "../mail/templates/baseEmailTemplate.js";
import mailSender from "../utils/mailSender.js";
import { getQuotes } from "./marketData.service.js";

const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
// TwelveData's free tier allows 8 requests a minute, so check a few symbols per run
const DEFAULT_SYMBOLS_PER_RUN = 8;

const escapeHtml = (text) =>
    String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const sendAlertEmail = async (alert, price) => {
    const user = await User.findById(alert.userId).select("email firstName");
    if (!user?.email) return;

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:3001").replace(/\/$/, "");
    const direction = alert.condition === "above" ? "risen above" : "fallen below";
    const currency = alert.currency ? ` ${escapeHtml(alert.currency)}` : "";

    const html = baseEmailTemplate({
        title: `${alert.symbol} price alert`,
        eyebrow: "Price Alert",
        heading: `${escapeHtml(alert.symbol)} has ${direction} your target`,
        body: `
            <p style="margin:0 0 15px;">Hi ${escapeHtml(user.firstName || "there")},</p>
            <p style="margin:0 0 15px;">${escapeHtml(alert.symbol)} is now trading at <strong>${price}${currency}</strong>, ${direction} your target of ${alert.targetPrice}${currency}.</p>
            ${alert.note ? `<p style="margin:0 0 15px;">Your note: ${escapeHtml(alert.note)}</p>` : ""}
            <p style="margin:0;font-size:12px;color:#6b7280;">Prices may be delayed. This alert has now been switched off.</p>
        `,
        ctaText: "Open Dashboard",
        ctaUrl: `${frontendUrl}/dashboard`,
        footerNote: "You're receiving this because you set a price alert on Zelbi.",
    });

    await mailSender(user.email, `Zelbi alert: ${alert.symbol} ${alert.condition} ${alert.targetPrice}`, html);
};

/**
 * Checks one batch of active alerts against the latest prices and emails
 * users whose alerts fire. Symbols checked least recently go first.
 */
export const checkAlerts = async ({ symbolsPerRun = DEFAULT_SYMBOLS_PER_RUN } = {}) => {
    const symbols = await Alert.aggregate([
        { $match: { status: "active" } },
        { $group: { _id: "$symbol", lastCheckedAt: { $min: "$lastCheckedAt" } } },
        { $sort: { lastCheckedAt: 1 } },
        { $limit: symbolsPerRun },
    ]);
    if (symbols.length === 0) return { checked: 0, triggered: 0 };

    const symbolNames = symbols.map((s) => s._id);
    const quotes = await getQuotes(symbolNames);
    await Alert.updateMany(
        { symbol: { $in: symbolNames }, status: "active" },
        { lastCheckedAt: new Date() }
    );

    let triggered = 0;
    for (const symbol of symbolNames) {
        const price = quotes[symbol]?.price;
        if (price === null || price === undefined) continue;

        const due = await Alert.find({
            symbol,
            status: "active",
            $or: [
                { condition: "above", targetPrice: { $lte: price } },
                { condition: "below", targetPrice: { $gte: price } },
            ],
        });

        for (const alert of due) {
            // Claim the alert atomically so it only fires once, even with several server instances
            const claimed = await Alert.findOneAndUpdate(
                { _id: alert._id, status: "active" },
                { status: "triggered", triggeredAt: new Date(), triggeredPrice: price },
                { new: true }
            );
            if (!claimed) continue;

            triggered++;
            try {
                await sendAlertEmail(claimed, price);
            } catch (err) {
                console.error(`Failed to send alert email for ${symbol}:`, err.message);
            }
        }
    }

    return { checked: symbolNames.length, triggered };
};

let timer = null;

export const startAlertChecker = () => {
    if (timer) return;
    if (!process.env.TWELVEDATA_API_KEY) {
        console.warn("Price alerts are disabled: TWELVEDATA_API_KEY is not set");
        return;
    }

    const interval = Number(process.env.ALERT_CHECK_INTERVAL_MS) || DEFAULT_INTERVAL_MS;
    const symbolsPerRun = Number(process.env.ALERT_SYMBOLS_PER_RUN) || DEFAULT_SYMBOLS_PER_RUN;
    let running = false;

    timer = setInterval(async () => {
        if (running) return;
        running = true;
        try {
            const { checked, triggered } = await checkAlerts({ symbolsPerRun });
            if (triggered > 0) console.log(`Price alerts: checked ${checked} symbols, triggered ${triggered}`);
        } catch (err) {
            console.error("Price alert check failed:", err.message);
        } finally {
            running = false;
        }
    }, interval);
    timer.unref();

    console.log(`Price alert checker running every ${Math.round(interval / 1000)}s`);
};
