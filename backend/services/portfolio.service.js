import Holding from "../models/Holding.js";
import { getQuotes } from "./marketData.service.js";

const round = (value, digits = 2) =>
    value === null || value === undefined ? null : Number(value.toFixed(digits));

/**
 * Loads a user's holdings and values them at the latest market prices.
 * Holdings whose quote can't be fetched are returned without live values.
 * @param {string} userId
 */
export const getValuedPortfolio = async (userId) => {
    const holdings = await Holding.find({ userId }).sort({ createdAt: 1 }).lean();
    const quotes = holdings.length ? await getQuotes(holdings.map((h) => h.symbol)) : {};

    // Totals are kept per currency, since holdings can trade in INR, USD, etc.
    const totals = {};

    const valued = holdings.map((holding) => {
        const quote = quotes[holding.symbol];
        const costBasis = holding.quantity * holding.avgPrice;

        if (!quote || quote.price === null) {
            return { ...holding, costBasis: round(costBasis), quote: null };
        }

        const currency = quote.currency || "USD";
        const marketValue = holding.quantity * quote.price;
        const pnl = marketValue - costBasis;
        const dayChange = quote.change !== null ? holding.quantity * quote.change : 0;

        totals[currency] ??= { currency, marketValue: 0, costBasis: 0, dayChange: 0 };
        totals[currency].marketValue += marketValue;
        totals[currency].costBasis += costBasis;
        totals[currency].dayChange += dayChange;

        return {
            ...holding,
            currency,
            name: holding.name || quote.name,
            currentPrice: quote.price,
            dayChangePercent: quote.percentChange,
            marketValue: round(marketValue),
            costBasis: round(costBasis),
            pnl: round(pnl),
            pnlPercent: costBasis > 0 ? round((pnl / costBasis) * 100) : null,
            dayChange: round(dayChange),
        };
    });

    const summary = Object.values(totals).map((total) => {
        const pnl = total.marketValue - total.costBasis;
        const previousValue = total.marketValue - total.dayChange;
        return {
            currency: total.currency,
            marketValue: round(total.marketValue),
            costBasis: round(total.costBasis),
            pnl: round(pnl),
            pnlPercent: total.costBasis > 0 ? round((pnl / total.costBasis) * 100) : null,
            dayChange: round(total.dayChange),
            dayChangePercent: previousValue > 0 ? round((total.dayChange / previousValue) * 100) : null,
        };
    });

    // Largest currency bucket first, so the UI can show it as the headline
    summary.sort((a, b) => b.marketValue - a.marketValue);

    return { holdings: valued, summary };
};
