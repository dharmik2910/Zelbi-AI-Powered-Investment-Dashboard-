import axios from "axios";

const TWELVEDATA_BASE_URL = "https://api.twelvedata.com";
const VALID_INTERVALS = ["1min", "5min", "15min", "30min", "45min", "1h", "2h", "4h", "1day", "1week", "1month"];
const SYMBOL_PATTERN = /^[A-Za-z0-9.:\-/]{1,20}$/;

// Short-lived cache so repeated dashboard loads don't burn through the TwelveData quota
const CACHE_TTL_MS = 60 * 1000;
const MAX_CACHE_ENTRIES = 500;
const cache = new Map();

const fetchTwelveData = async (path, params) => {
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

export const getTimeSeries = async (req, res) => {
    try {
        const { symbol, interval = "1day" } = req.query;

        if (!symbol || !SYMBOL_PATTERN.test(symbol)) {
            return res.status(400).json({ success: false, error: "Invalid symbol" });
        }
        if (!VALID_INTERVALS.includes(interval)) {
            return res.status(400).json({ success: false, error: "Invalid interval" });
        }

        const data = await fetchTwelveData("/time_series", {
            symbol: symbol.toUpperCase(),
            interval,
            outputsize: 500,
        });

        if (data.status !== "ok") {
            return res.status(404).json({ success: false, error: data.message || "Symbol not found" });
        }

        return res.status(200).json({ success: true, meta: data.meta, values: data.values });
    } catch (err) {
        console.error("Error in getTimeSeries:", err.message);
        return res.status(502).json({ success: false, error: "Failed to fetch market data" });
    }
};

export const searchSymbols = async (req, res) => {
    try {
        const query = (req.query.q || "").trim();

        if (!query || query.length > 50) {
            return res.status(200).json({ success: true, results: [] });
        }

        const data = await fetchTwelveData("/symbol_search", { symbol: query });

        return res.status(200).json({ success: true, results: (data.data || []).slice(0, 6) });
    } catch (err) {
        console.error("Error in searchSymbols:", err.message);
        return res.status(502).json({ success: false, error: "Failed to search symbols" });
    }
};
