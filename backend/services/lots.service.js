// FIFO lot matching for a list of buy and sell trades. Pure functions, no database access.

const EPSILON = 1e-9;

const compareTrades = (a, b) => {
    const byDate = new Date(a.date) - new Date(b.date);
    if (byDate !== 0) return byDate;
    // Same day: process buys before sells so intraday round trips work
    if (a.type !== b.type) return a.type === "buy" ? -1 : 1;
    return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
};

export class OversellError extends Error {
    constructor(symbol, date, requested, available) {
        super(
            `Can't sell ${requested} ${symbol} on ${new Date(date).toISOString().slice(0, 10)}: only ${Number(available.toFixed(6))} held on that date`
        );
        this.symbol = symbol;
    }
}

/**
 * Replays trades in date order and matches every sell against the oldest open buy lots.
 * @param {Array} trades - { symbol, type, quantity, price, fees, date, createdAt }
 * @returns {{ openLots: Object<string, Array>, realized: Array }}
 * @throws {OversellError} if a sell is larger than the quantity held at that time
 */
export const matchLots = (trades) => {
    const openLots = {};
    const realized = [];

    for (const trade of [...trades].sort(compareTrades)) {
        const symbol = trade.symbol;
        const lots = (openLots[symbol] ??= []);
        const quantity = Number(trade.quantity);
        const price = Number(trade.price);
        const fees = Number(trade.fees) || 0;

        if (trade.type === "buy") {
            // Buy charges are added to the cost of the shares
            lots.push({
                quantity,
                costPerShare: price + fees / quantity,
                buyPrice: price,
                buyDate: new Date(trade.date),
                name: trade.name,
            });
            continue;
        }

        const available = lots.reduce((sum, lot) => sum + lot.quantity, 0);
        if (quantity > available + EPSILON) {
            throw new OversellError(symbol, trade.date, quantity, available);
        }

        // Sell charges reduce the sale proceeds
        const netSellPerShare = price - fees / quantity;
        let remaining = quantity;
        while (remaining > EPSILON) {
            const lot = lots[0];
            const used = Math.min(lot.quantity, remaining);
            const cost = used * lot.costPerShare;
            const proceeds = used * netSellPerShare;

            realized.push({
                symbol,
                quantity: used,
                buyDate: lot.buyDate,
                sellDate: new Date(trade.date),
                buyPrice: lot.buyPrice,
                sellPrice: price,
                cost,
                proceeds,
                gain: proceeds - cost,
            });

            lot.quantity -= used;
            remaining -= used;
            if (lot.quantity <= EPSILON) lots.shift();
        }
    }

    for (const symbol of Object.keys(openLots)) {
        if (openLots[symbol].length === 0) delete openLots[symbol];
    }

    return { openLots, realized };
};

/**
 * Collapses open lots into one position per symbol.
 */
export const summarizePositions = (openLots) =>
    Object.entries(openLots).map(([symbol, lots]) => {
        const quantity = lots.reduce((sum, lot) => sum + lot.quantity, 0);
        const cost = lots.reduce((sum, lot) => sum + lot.quantity * lot.costPerShare, 0);
        return {
            symbol,
            name: lots.find((lot) => lot.name)?.name,
            quantity: Number(quantity.toFixed(6)),
            avgPrice: quantity > 0 ? cost / quantity : 0,
            firstBuyDate: lots[0].buyDate,
            lots: lots.length,
        };
    });
