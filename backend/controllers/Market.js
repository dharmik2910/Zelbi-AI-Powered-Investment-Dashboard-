import { fetchTwelveData, getQuote, SYMBOL_PATTERN } from "../services/marketData.service.js";

const VALID_INTERVALS = ["1min", "5min", "15min", "30min", "45min", "1h", "2h", "4h", "1day", "1week", "1month"];

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

export const getStockQuote = async (req, res) => {
    try {
        const { symbol } = req.query;

        if (!symbol || !SYMBOL_PATTERN.test(symbol)) {
            return res.status(400).json({ success: false, error: "Invalid symbol" });
        }

        const quote = await getQuote(symbol);
        if (!quote) {
            return res.status(404).json({ success: false, error: "Symbol not found" });
        }

        return res.status(200).json({ success: true, quote });
    } catch (err) {
        console.error("Error in getStockQuote:", err.message);
        return res.status(502).json({ success: false, error: "Failed to fetch quote" });
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
