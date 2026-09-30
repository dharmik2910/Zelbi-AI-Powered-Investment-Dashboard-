// Indian capital gains estimates for realized trades. These are estimates for planning,
// not tax advice: grandfathering (pre-Feb 2018 cost), surcharge, cess, the basic exemption
// limit and carried-forward losses are not included.

// Budget 2024 changed equity rates for transfers on or after 23 July 2024
const RATE_CHANGE_DATE = new Date("2024-07-23T00:00:00+05:30");

const DAY_MS = 24 * 60 * 60 * 1000;

/** Indian financial year label (April to March) for a date, e.g. "2025-26". */
export const financialYearOf = (date) => {
    const d = new Date(date);
    const startYear = d.getMonth() >= 3 ? d.getFullYear() : d.getFullYear() - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
};

const financialYearStart = (fy) => Number(fy.slice(0, 4));

// Held for more than `months` months
const isLongTerm = (buyDate, sellDate, months) => {
    const threshold = new Date(buyDate);
    threshold.setMonth(threshold.getMonth() + months);
    return new Date(sellDate) > threshold;
};

const listedEquityRates = (sellDate) =>
    new Date(sellDate) >= RATE_CHANGE_DATE
        ? { stcg: 0.20, ltcg: 0.125 }
        : { stcg: 0.15, ltcg: 0.10 };

const ltcgExemption = (fy) => (financialYearStart(fy) >= 2024 ? 125000 : 100000);

const round = (value) => Math.round(value * 100) / 100;

/**
 * Classifies realized trades and estimates tax for one financial year.
 * INR trades are treated as listed Indian equity (STT paid). Other currencies are
 * treated as foreign shares: classified only, since they're taxed at slab rates
 * after conversion to INR.
 * @param {Array} realized - output of matchLots().realized, with a currency on each entry
 * @param {string} fy - e.g. "2025-26"
 */
export const estimateCapitalGains = (realized, fy) => {
    const trades = realized
        .filter((r) => financialYearOf(r.sellDate) === fy)
        .map((r) => {
            const isIndian = r.currency === "INR";
            const longTerm = isLongTerm(r.buyDate, r.sellDate, isIndian ? 12 : 24);
            const rates = isIndian ? listedEquityRates(r.sellDate) : null;
            return {
                ...r,
                term: longTerm ? "long" : "short",
                holdingDays: Math.round((new Date(r.sellDate) - new Date(r.buyDate)) / DAY_MS),
                rate: rates ? (longTerm ? rates.ltcg : rates.stcg) : null,
            };
        });

    const indian = trades.filter((t) => t.currency === "INR");
    const foreign = trades.filter((t) => t.currency !== "INR");

    // Group Indian gains into buckets by term and rate so set-off can be applied
    const buckets = {};
    for (const t of indian) {
        const key = `${t.term}:${t.rate}`;
        buckets[key] ??= { term: t.term, rate: t.rate, gains: 0, losses: 0 };
        if (t.gain >= 0) buckets[key].gains += t.gain;
        else buckets[key].losses += -t.gain;
    }
    const list = Object.values(buckets);
    const shortBuckets = list.filter((b) => b.term === "short").sort((a, b) => b.rate - a.rate);
    const longBuckets = list.filter((b) => b.term === "long").sort((a, b) => b.rate - a.rate);

    // Net each bucket against its own losses first
    for (const b of list) {
        const offset = Math.min(b.gains, b.losses);
        b.gains -= offset;
        b.losses -= offset;
    }

    // Leftover losses reduce the highest-rate gains they are allowed to:
    // short-term losses against short- or long-term gains, long-term losses against long-term only
    const applyLosses = (losses, targets) => {
        let remaining = losses;
        for (const target of targets) {
            const used = Math.min(target.gains, remaining);
            target.gains -= used;
            remaining -= used;
        }
        return remaining;
    };
    let shortLossLeft = shortBuckets.reduce((sum, b) => sum + b.losses, 0);
    let longLossLeft = longBuckets.reduce((sum, b) => sum + b.losses, 0);
    shortLossLeft = applyLosses(shortLossLeft, [...shortBuckets, ...longBuckets]);
    longLossLeft = applyLosses(longLossLeft, longBuckets);

    // The yearly long-term exemption is applied to the highest-rate long-term gains first
    const exemption = ltcgExemption(fy);
    let exemptionLeft = exemption;
    for (const b of longBuckets) {
        const used = Math.min(b.gains, exemptionLeft);
        b.taxable = b.gains - used;
        exemptionLeft -= used;
    }
    for (const b of shortBuckets) b.taxable = b.gains;

    const sum = (items, field) => items.reduce((total, item) => total + item[field], 0);
    const grossGain = (term) => sum(indian.filter((t) => t.term === term && t.gain > 0), "gain");
    const grossLoss = (term) => -sum(indian.filter((t) => t.term === term && t.gain < 0), "gain");

    const taxBreakdown = [...shortBuckets, ...longBuckets]
        .filter((b) => b.taxable > 0)
        .map((b) => ({
            term: b.term,
            rate: b.rate,
            taxable: round(b.taxable),
            tax: round(b.taxable * b.rate),
        }));

    const foreignByCurrency = {};
    for (const t of foreign) {
        const c = (foreignByCurrency[t.currency || "USD"] ??= { currency: t.currency || "USD", shortTerm: 0, longTerm: 0 });
        if (t.term === "short") c.shortTerm += t.gain;
        else c.longTerm += t.gain;
    }

    return {
        financialYear: fy,
        indian: {
            shortTermGains: round(grossGain("short")),
            shortTermLosses: round(grossLoss("short")),
            longTermGains: round(grossGain("long")),
            longTermLosses: round(grossLoss("long")),
            ltcgExemption: exemption,
            exemptionUsed: round(exemption - exemptionLeft),
            taxBreakdown,
            estimatedTax: round(sum(taxBreakdown, "tax")),
            lossesToCarryForward: {
                shortTerm: round(shortLossLeft),
                longTerm: round(longLossLeft),
            },
        },
        foreign: Object.values(foreignByCurrency).map((c) => ({
            currency: c.currency,
            shortTermGain: round(c.shortTerm),
            longTermGain: round(c.longTerm),
        })),
        trades: trades
            .sort((a, b) => new Date(a.sellDate) - new Date(b.sellDate))
            .map((t) => ({
                symbol: t.symbol,
                currency: t.currency,
                quantity: t.quantity,
                buyDate: t.buyDate,
                sellDate: t.sellDate,
                buyPrice: round(t.buyPrice),
                sellPrice: round(t.sellPrice),
                cost: round(t.cost),
                proceeds: round(t.proceeds),
                gain: round(t.gain),
                term: t.term,
                holdingDays: t.holdingDays,
                rate: t.rate,
            })),
    };
};
