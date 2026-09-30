import axios from "axios";
import debounce from "lodash/debounce";
import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { FaPlus, FaTimes } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

const MARKET_URL = `${process.env.REACT_APP_API_URL}/api/market`;
const MAX_SYMBOLS = 4;
const COLORS = ["#3affa3", "#38bdf8", "#facc15", "#f472b6"];

// Daily data covers about two years; weekly is used for longer ranges
const RANGES = [
  { label: "1M", months: 1, interval: "1day" },
  { label: "6M", months: 6, interval: "1day" },
  { label: "1Y", months: 12, interval: "1day" },
  { label: "2Y", months: 24, interval: "1day" },
  { label: "5Y", months: 60, interval: "1week" },
];

const PERIODS_PER_YEAR = { "1day": 252, "1week": 52 };

const cutoffDate = (months) => {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.getTime();
};

/**
 * Return, annualised volatility, max drawdown and range for a list of { time, close } points.
 */
const computeStats = (points, interval) => {
  if (points.length < 2) return null;
  const closes = points.map((p) => p.close);
  const first = closes[0];
  const last = closes[closes.length - 1];

  const logReturns = closes.slice(1).map((close, i) => Math.log(close / closes[i]));
  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
  const variance = logReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / Math.max(logReturns.length - 1, 1);

  let peak = closes[0];
  let maxDrawdown = 0;
  for (const close of closes) {
    peak = Math.max(peak, close);
    maxDrawdown = Math.min(maxDrawdown, (close - peak) / peak);
  }

  return {
    last,
    returnPct: ((last - first) / first) * 100,
    volatilityPct: Math.sqrt(variance * PERIODS_PER_YEAR[interval]) * 100,
    maxDrawdownPct: maxDrawdown * 100,
    high: Math.max(...closes),
    low: Math.min(...closes),
  };
};

const fmt = (value, digits = 2) => (value === null || value === undefined ? "—" : value.toFixed(digits));
const signed = (value) => `${value > 0 ? "+" : ""}${fmt(value)}%`;

const Compare = () => {
  const { token } = useSelector((state) => state.auth);
  const [searchParams, setSearchParams] = useSearchParams();
  const symbols = useMemo(
    () => (searchParams.get("symbols") || "AAPL,MSFT")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean)
      .slice(0, MAX_SYMBOLS),
    [searchParams]
  );
  const [range, setRange] = useState(RANGES[2]);
  const [series, setSeries] = useState({}); // symbol -> { points, currency, name } or { error }
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  useEffect(() => {
    document.title = "Zelbi | Compare Stocks";
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all(
      symbols.map(async (symbol) => {
        try {
          const { data } = await axios.get(`${MARKET_URL}/time-series`, {
            params: { symbol, interval: range.interval },
            headers,
          });
          const points = data.values
            .map((v) => ({ time: new Date(v.datetime).getTime(), close: parseFloat(v.close) }))
            .filter((p) => Number.isFinite(p.close))
            .reverse();
          return [symbol, { points, currency: data.meta?.currency, exchange: data.meta?.exchange }];
        } catch (err) {
          return [symbol, { error: err.response?.data?.error || "No data" }];
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setSeries(Object.fromEntries(entries));
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [symbols, range.interval, headers]);

  const cutoff = cutoffDate(range.months);

  const rows = symbols.map((symbol, index) => {
    const entry = series[symbol];
    if (!entry || entry.error) return { symbol, color: COLORS[index], error: entry?.error };
    const points = entry.points.filter((p) => p.time >= cutoff);
    return { symbol, color: COLORS[index], currency: entry.currency, points, stats: computeStats(points, range.interval) };
  });

  // Rebase every line to 100 at the start of the range so different prices compare fairly
  const chartSeries = rows
    .filter((r) => r.points?.length > 1)
    .map((r) => ({
      name: r.symbol,
      data: r.points.map((p) => [p.time, Number(((p.close / r.points[0].close) * 100).toFixed(2))]),
    }));

  const chartOptions = {
    chart: { type: "line", background: "transparent", toolbar: { show: false }, zoom: { enabled: false } },
    colors: rows.filter((r) => r.points?.length > 1).map((r) => r.color),
    stroke: { width: 2, curve: "straight" },
    xaxis: { type: "datetime", labels: { style: { colors: "#9ca3af" } } },
    yaxis: { labels: { style: { colors: "#9ca3af" }, formatter: (v) => v.toFixed(0) } },
    grid: { borderColor: "#1f1f1f" },
    legend: { labels: { colors: "#d1d5db" } },
    tooltip: { theme: "dark", x: { format: "dd MMM yyyy" }, y: { formatter: (v) => `${v.toFixed(1)} (${signed(v - 100)})` } },
    annotations: { yaxis: [{ y: 100, borderColor: "#4b5563", strokeDashArray: 4 }] },
    theme: { mode: "dark" },
  };

  const setSymbols = (next) => setSearchParams({ symbols: next.join(",") });

  const addSymbol = (symbol) => {
    const clean = symbol.trim().toUpperCase();
    if (!clean || symbols.includes(clean) || symbols.length >= MAX_SYMBOLS) return;
    setSymbols([...symbols, clean]);
    setQuery("");
    setResults([]);
  };

  const search = useMemo(
    () => debounce(async (text) => {
      try {
        const { data } = await axios.get(`${MARKET_URL}/search`, { params: { q: text }, headers });
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
    }, 400),
    [headers]
  );

  const handleQuery = (e) => {
    const value = e.target.value.toUpperCase();
    setQuery(value);
    if (value.trim()) search(value.trim());
    else setResults([]);
  };

  const pickResult = (result) =>
    addSymbol(result.country === "India" && result.exchange ? `${result.symbol}:${result.exchange}` : result.symbol);

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold">Compare Stocks</h1>
        <p className="text-gray-400 mt-1 mb-6">
          See how up to {MAX_SYMBOLS} stocks performed over the same period. Every line starts at 100.
        </p>

        <div className="flex flex-col lg:flex-row lg:items-center gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            {symbols.map((symbol, index) => (
              <span key={symbol} className="inline-flex items-center gap-2 rounded-full bg-[#141414] border border-[#2a2a2a] pl-3 pr-1 py-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} aria-hidden="true" />
                <span className="font-medium">{symbol}</span>
                <button
                  type="button"
                  onClick={() => setSymbols(symbols.filter((s) => s !== symbol))}
                  aria-label={`Remove ${symbol}`}
                  className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
                >
                  <FaTimes className="text-xs" />
                </button>
              </span>
            ))}

            {symbols.length < MAX_SYMBOLS && (
              <form
                className="relative"
                onSubmit={(e) => {
                  e.preventDefault();
                  addSymbol(query);
                }}
              >
                <label htmlFor="compare-add" className="sr-only">Add a symbol</label>
                <input
                  id="compare-add"
                  value={query}
                  onChange={handleQuery}
                  placeholder="Add symbol"
                  autoComplete="off"
                  className="w-40 bg-[#141414] border border-[#2a2a2a] rounded-full pl-4 pr-9 py-1.5 text-sm focus:outline-none focus:border-primary"
                />
                <button type="submit" aria-label="Add symbol" className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-primary">
                  <FaPlus className="text-xs" />
                </button>
                {results.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-72 bg-[#141414] border border-[#2a2a2a] rounded-lg max-h-56 overflow-y-auto custom-scrollbar">
                    {results.map((r) => (
                      <li key={`${r.symbol}-${r.exchange}`}>
                        <button type="button" onClick={() => pickResult(r)} className="w-full text-left px-3 py-2 text-sm hover:bg-white/5">
                          <span className="font-medium">{r.symbol}</span>
                          <span className="ml-2 text-gray-400">{r.instrument_name} · {r.exchange}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </form>
            )}
          </div>

          <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1" role="group" aria-label="Time range">
            {RANGES.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => setRange(r)}
                aria-pressed={range.label === r.label}
                className={`px-3 py-1.5 rounded-lg text-sm ${range.label === r.label ? "bg-primary text-black font-medium" : "text-gray-300 hover:bg-white/5"}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 sm:p-5 mb-6">
          {loading ? (
            <div className="h-[360px] rounded-xl bg-white/5 animate-pulse" aria-busy="true" />
          ) : chartSeries.length === 0 ? (
            <p className="h-[200px] flex items-center justify-center text-gray-400">Add a symbol to start comparing.</p>
          ) : (
            <ReactApexChart options={chartOptions} series={chartSeries} type="line" height={360} />
          )}
        </div>

        <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 sm:p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 border-b border-[#1a1a1a]">
                <th className="py-2 pr-3 font-medium">Stock</th>
                <th className="py-2 px-3 font-medium text-right">Last price</th>
                <th className="py-2 px-3 font-medium text-right">Return ({range.label})</th>
                <th className="py-2 px-3 font-medium text-right">Volatility (yearly)</th>
                <th className="py-2 px-3 font-medium text-right">Max drawdown</th>
                <th className="py-2 pl-3 font-medium text-right">Range low – high</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.symbol} className="border-b border-[#1a1a1a] last:border-0">
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} aria-hidden="true" />
                      <span className="font-medium">{r.symbol}</span>
                      {r.currency && <span className="text-xs text-gray-500">{r.currency}</span>}
                    </span>
                  </td>
                  {r.error || !r.stats ? (
                    <td colSpan={5} className="py-3 px-3 text-right text-gray-500">
                      {loading ? "Loading…" : r.error || "Not enough data for this range"}
                    </td>
                  ) : (
                    <>
                      <td className="py-3 px-3 text-right">{fmt(r.stats.last)}</td>
                      <td className={`py-3 px-3 text-right ${r.stats.returnPct >= 0 ? "text-green-400" : "text-red-400"}`}>{signed(r.stats.returnPct)}</td>
                      <td className="py-3 px-3 text-right">{fmt(r.stats.volatilityPct, 1)}%</td>
                      <td className="py-3 px-3 text-right text-red-400">{fmt(r.stats.maxDrawdownPct, 1)}%</td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">{fmt(r.stats.low)} – {fmt(r.stats.high)}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-gray-500">
            Based on closing prices{range.interval === "1week" ? " (weekly)" : ""}. Volatility is annualised from price changes.
            Returns exclude dividends. Past performance doesn't predict future returns.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Compare;
