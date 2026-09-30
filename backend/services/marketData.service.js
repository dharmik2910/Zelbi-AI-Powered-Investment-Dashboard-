import axios from "axios";

const TWELVEDATA_BASE_URL = "https://api.twelvedata.com";
export const SYMBOL_PATTERN = /^[A-Za-z0-9.:\-/]{1,20}$/;

// Short-lived cache so repeated dashboard loads don't burn through the TwelveData quota
const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const cache = new Map();

export const fetchTwelveData = async (path, params) => {
    const apiKey = process.env.TWELVEDATA_API_KEY;
    if (!apiKey) {
        throw new Error("TWELVEDATA_API_KEY is not set");
    }

    const cacheKey = `${path}?${new URLSearchParams(params).toString()}`;
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
    }

    const response = await axios.get(`${TWELVEDATA_BASE_URL}${path}`, {
        params: { ...params, apikey: apiKey },
        timeout: 10000,
    });

    if (cache.size >= MAX_CACHE_ENTRIES) {
        cache.delete(cache.keys().next().value);
    }
    cache.set(cacheKey, { data: response.data, expiresAt: Date.now() + CACHE_TTL_MS });

    return response.data;
};

const toNumber = (value) => {
    const number = parseFloat(value);
    return Number.isFinite(number) ? number : null;
};

/**
 * Latest quote for one symbol, or null if TwelveData doesn't know it.
 * @param {string} symbol - Ticker, e.g. "AAPL" or "RELIANCE:NSE"
 */
export const getQuote = async (symbol) => {
    if (!symbol || !SYMBOL_PATTERN.test(symbol)) return null;

    const data = await fetchTwelveData("/quote", { symbol: symbol.toUpperCase() });
    if (!data || data.status === "error" || data.close === undefined) return null;

    return {
        symbol: data.symbol,
        name: data.name,
        exchange: data.exchange,
        currency: data.currency,
        price: toNumber(data.close),
        previousClose: toNumber(data.previous_close),
        change: toNumber(data.change),
        percentChange: toNumber(data.percent_change),
        open: toNumber(data.open),
        high: toNumber(data.high),
        low: toNumber(data.low),
        volume: toNumber(data.volume),
        fiftyTwoWeekLow: toNumber(data.fifty_two_week?.low),
        fiftyTwoWeekHigh: toNumber(data.fifty_two_week?.high),
        isMarketOpen: Boolean(data.is_market_open),
        asOf: data.datetime,
    };
};

/**
 * Latest price for several symbols. Symbols that fail are left out.
 * @param {string[]} symbols
 * @returns {Promise<Record<string, Object>>} quotes keyed by upper-case symbol
 */
export const getQuotes = async (symbols) => {
    const unique = [...new Set(symbols.map((s) => s.toUpperCase()))];
    const results = await Promise.allSettled(unique.map((symbol) => getQuote(symbol)));
    const quotes = {};
    results.forEach((result, index) => {
        if (result.status === "fulfilled" && result.value) {
            quotes[unique[index]] = result.value;
        }
    });
    return quotes;
};
