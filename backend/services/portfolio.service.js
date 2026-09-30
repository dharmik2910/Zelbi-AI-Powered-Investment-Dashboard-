import Holding from "../models/Holding.js";
import Transaction from "../models/Transaction.js";
import { estimateCapitalGains, financialYearOf } from "./capitalGains.service.js";
import { matchLots, summarizePositions } from "./lots.service.js";
import { getQuote, getQuotes } from "./marketData.service.js";

const round = (value, digits = 2) =>
    value === null || value === undefined ? null : Number(value.toFixed(digits));

/** Currency implied by an exchange suffix, e.g. RELIANCE:NSE is INR. */
export const inferCurrency = (symbol) => (/:(NSE|BSE)$/i.test(symbol) ? "INR" : null);

/**
 * Converts holdings saved before trades existed into buy trades, once per user.
 */
export const migrateLegacyHoldings = async (userId) => {
    const holdings = await Holding.find({ userId }).lean();
    for (const holding of holdings) {
        await Transaction.create({
            userId,
            symbol: holding.symbol,
            name: holding.name,
            currency: inferCurrency(holding.symbol) ?? undefined,
            type: "buy",
            quantity: holding.quantity,
            price: holding.avgPrice,
            date: holding.buyDate || holding.createdAt,
            notes: holding.notes,
        });
        await Holding.deleteOne({ _id: holding._id });
    }
};

export const getUserTrades = async (userId) => {
    await migrateLegacyHoldings(userId);
    return Transaction.find({ userId }).sort({ date: 1, createdAt: 1 }).lean();
};

/**
 * Loads a user's trades, works out open positions with FIFO and values them at the
 * latest market prices. Positions whose quote can't be fetched have no live values.
 * @param {string} userId
 */
export const getValuedPortfolio = async (userId) => {
    const trades = await getUserTrades(userId);
    const { openLots, realized } = matchLots(trades);
    const positions = summarizePositions(openLots);
    const quotes = positions.length ? await getQuotes(positions.map((p) => p.symbol)) : {};

    // Totals are kept per currency, since holdings can trade in INR, USD, etc.
    const totals = {};

    const holdings = positions.map((position) => {
        const quote = quotes[position.symbol];
        const costBasis = position.quantity * position.avgPrice;
        const base = { ...position, avgPrice: round(position.avgPrice, 4), costBasis: round(costBasis) };

        if (!quote || quote.price === null) {
            return { ...base, currency: inferCurrency(position.symbol) };
        }

        const currency = quote.currency || "USD";
        const marketValue = position.quantity * quote.price;
        const pnl = marketValue - costBasis;
        const dayChange = quote.change !== null ? position.quantity * quote.change : 0;

        totals[currency] ??= { currency, marketValue: 0, costBasis: 0, dayChange: 0 };
        totals[currency].marketValue += marketValue;
        totals[currency].costBasis += costBasis;
        totals[currency].dayChange += dayChange;

        return {
            ...base,
            currency,
            name: position.name || quote.name,
            currentPrice: quote.price,
            dayChangePercent: quote.percentChange,
            marketValue: round(marketValue),
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

    const realizedByCurrency = {};
    const currencyOf = Object.fromEntries(trades.map((t) => [t.symbol, t.currency || inferCurrency(t.symbol)]));
    for (const r of realized) {
        const currency = quotes[r.symbol]?.currency || currencyOf[r.symbol] || "USD";
        realizedByCurrency[currency] = (realizedByCurrency[currency] || 0) + r.gain;
    }

    return {
        holdings,
        summary,
        realizedPnl: Object.entries(realizedByCurrency).map(([currency, pnl]) => ({ currency, pnl: round(pnl) })),
    };
};

/**
 * Capital gains estimate for one financial year from the user's sells.
 * Fills in missing trade currencies from live quotes first.
 */
export const getCapitalGains = async (userId, fy) => {
    const trades = await getUserTrades(userId);

    const missing = [...new Set(trades.filter((t) => !t.currency && !inferCurrency(t.symbol)).map((t) => t.symbol))];
    const currencyBySymbol = {};
    for (const symbol of missing) {
        const quote = await getQuote(symbol).catch(() => null);
        if (quote?.currency) {
            currencyBySymbol[symbol] = quote.currency;
            await Transaction.updateMany({ userId, symbol, currency: { $exists: false } }, { currency: quote.currency });
        }
    }

    const currencyOf = (symbol) =>
        trades.find((t) => t.symbol === symbol && t.currency)?.currency ||
        inferCurrency(symbol) ||
        currencyBySymbol[symbol] ||
        null;

    const { realized } = matchLots(trades);
    const withCurrency = realized.map((r) => ({ ...r, currency: currencyOf(r.symbol) }));

    const years = [...new Set(realized.map((r) => financialYearOf(r.sellDate)))].sort().reverse();
    const currentFy = financialYearOf(new Date());
    const financialYear = fy || years[0] || currentFy;

    return {
        availableYears: years.includes(currentFy) ? years : [currentFy, ...years],
        ...estimateCapitalGains(withCurrency, financialYear),
    };
};
