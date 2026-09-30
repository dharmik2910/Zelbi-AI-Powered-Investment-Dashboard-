import axios from "axios";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { toast } from "react-hot-toast";
import { FaDownload, FaEdit, FaFileImport, FaHistory, FaPlus, FaTrash, FaWallet } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { downloadCsv, toCsv } from "../utils/csv";
import { parseTradeCsv, TEMPLATE_EXAMPLE, TEMPLATE_HEADER } from "../utils/tradeImport";

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const CHART_COLORS = ["#3affa3", "#38bdf8", "#facc15", "#f472b6", "#a78bfa", "#fb923c", "#34d399", "#f87171"];

const today = () => new Date().toISOString().slice(0, 10);

const formatMoney = (value, currency) => {
  if (value === null || value === undefined) return "—";
  if (!currency) return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
};

const formatPercent = (value) =>
  value === null || value === undefined ? "—" : `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

const changeColor = (value) =>
  value > 0 ? "text-green-400" : value < 0 ? "text-red-400" : "text-gray-300";

const inputClass =
  "w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary";

const Modal = ({ title, onClose, children, wide = false }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={onClose} role="presentation">
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6`}
    >
      <h2 className="text-xl font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  </div>
);

const StatTile = ({ label, value, sub, subClass = "text-gray-400" }) => (
  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 sm:p-5">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-2 text-xl sm:text-2xl font-semibold text-white">{value}</p>
    {sub && <p className={`mt-1 text-sm ${subClass}`}>{sub}</p>}
  </div>
);

const TradeForm = ({ initial, isEdit, onCancel, onSubmit, token }) => {
  const [form, setForm] = useState(initial);
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const searchSymbols = useCallback(
    debounce(async (query) => {
      try {
        const { data } = await axios.get(`${API_URL}/market/search`, {
          params: { q: query },
          headers: { Authorization: `Bearer ${token}` },
        });
        setResults(data.results || []);
      } catch {
        setResults([]);
      }
    }, 400),
    [token]
  );

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSymbolChange = (e) => {
    const value = e.target.value.toUpperCase();
    setForm((prev) => ({ ...prev, symbol: value }));
    if (value.trim()) searchSymbols(value.trim());
    else setResults([]);
  };

  const pickResult = (result) => {
    const symbol = result.country === "India" && result.exchange ? `${result.symbol}:${result.exchange}` : result.symbol;
    setForm((prev) => ({ ...prev, symbol }));
    setResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isEdit ? `Edit ${form.symbol} trade` : "Add trade"} onClose={onCancel}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Trade type">
          {["buy", "sell"].map((type) => (
            <button
              key={type}
              type="button"
              role="radio"
              aria-checked={form.type === type}
              onClick={() => setForm((prev) => ({ ...prev, type }))}
              className={`py-2 rounded-lg font-medium capitalize ${
                form.type === type
                  ? type === "buy" ? "bg-primary text-black" : "bg-red-500 text-white"
                  : "bg-[#141414] text-gray-300 hover:bg-white/5"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {!isEdit && (
          <div className="relative">
            <label htmlFor="trade-symbol" className="block text-sm text-gray-300 mb-1">Symbol</label>
            <input
              id="trade-symbol"
              value={form.symbol}
              onChange={handleSymbolChange}
              placeholder="e.g. AAPL or RELIANCE:NSE"
              autoComplete="off"
              autoFocus
              required
              className={inputClass}
            />
            {results.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-[#141414] border border-[#2a2a2a] rounded-lg max-h-56 overflow-y-auto custom-scrollbar">
                {results.map((result) => (
                  <li key={`${result.symbol}-${result.exchange}`}>
                    <button type="button" onClick={() => pickResult(result)} className="w-full text-left px-3 py-2 hover:bg-white/5">
                      <span className="font-medium text-white">{result.symbol}</span>
                      <span className="ml-2 text-sm text-gray-400">{result.instrument_name} · {result.exchange}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="trade-qty" className="block text-sm text-gray-300 mb-1">Quantity</label>
            <input id="trade-qty" type="number" min="0" step="any" required value={form.quantity} onChange={update("quantity")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="trade-price" className="block text-sm text-gray-300 mb-1">Price per share</label>
            <input id="trade-price" type="number" min="0" step="any" required value={form.price} onChange={update("price")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="trade-date" className="block text-sm text-gray-300 mb-1">Date</label>
            <input id="trade-date" type="date" required max={today()} value={form.date} onChange={update("date")} className={`${inputClass} [color-scheme:dark]`} />
          </div>
          <div>
            <label htmlFor="trade-fees" className="block text-sm text-gray-300 mb-1">Charges (optional)</label>
            <input id="trade-fees" type="number" min="0" step="any" value={form.fees} onChange={update("fees")} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="trade-notes" className="block text-sm text-gray-300 mb-1">Notes (optional)</label>
          <textarea id="trade-notes" rows="2" maxLength={500} value={form.notes} onChange={update("notes")} className={inputClass} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-black font-medium hover:bg-primary-hover disabled:opacity-50">
            {saving ? "Saving…" : isEdit ? "Save changes" : `Add ${form.type}`}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const TradesList = ({ symbol, authHeaders, onEdit, onChanged, onClose }) => {
  const [trades, setTrades] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_URL}/portfolio/transactions`, { ...authHeaders, params: { symbol } });
      setTrades(data.transactions || []);
    } catch {
      setTrades([]);
      toast.error("Couldn't load trades");
    }
  }, [authHeaders, symbol]);

  useEffect(() => {
    load();
  }, [load]);

  const remove = async (trade) => {
    if (!window.confirm(`Delete this ${trade.type} of ${trade.quantity} ${symbol}?`)) return;
    try {
      await axios.delete(`${API_URL}/portfolio/transactions/${trade._id}`, authHeaders);
      toast.success("Trade deleted");
      load();
      onChanged();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't delete the trade");
    }
  };

  return (
    <Modal title={`${symbol} trades`} onClose={onClose} wide>
      {trades === null ? (
        <p className="text-gray-400">Loading…</p>
      ) : trades.length === 0 ? (
        <p className="text-gray-400">No trades for {symbol}.</p>
      ) : (
        <ul className="divide-y divide-[#1a1a1a]">
          {trades.map((trade) => (
            <li key={trade._id} className="flex items-center justify-between gap-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="text-white">
                  <span className={`font-semibold uppercase ${trade.type === "buy" ? "text-green-400" : "text-red-400"}`}>{trade.type}</span>{" "}
                  {trade.quantity} @ {formatMoney(trade.price, trade.currency)}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {new Date(trade.date).toLocaleDateString()}
                  {trade.fees ? ` · charges ${formatMoney(trade.fees, trade.currency)}` : ""}
                  {trade.notes ? ` · ${trade.notes}` : ""}
                </p>
              </div>
              <div className="flex shrink-0">
                <button type="button" onClick={() => onEdit(trade)} aria-label="Edit trade" className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                  <FaEdit />
                </button>
                <button type="button" onClick={() => remove(trade)} aria-label="Delete trade" className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5">
                  <FaTrash />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-end pt-4">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5">Close</button>
      </div>
    </Modal>
  );
};

const ImportDialog = ({ authHeaders, onClose, onImported }) => {
  const fileRef = useRef(null);
  const [parsed, setParsed] = useState(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [serverErrors, setServerErrors] = useState([]);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setServerErrors([]);
    setParsed(parseTradeCsv(await file.text()));
  };

  const downloadTemplate = () =>
    downloadCsv("zelbi-trades-template.csv", toCsv(TEMPLATE_HEADER, TEMPLATE_EXAMPLE));

  const handleImport = async () => {
    setImporting(true);
    setServerErrors([]);
    try {
      const { data } = await axios.post(`${API_URL}/portfolio/transactions/import`, { transactions: parsed.trades }, authHeaders);
      toast.success(`Imported ${data.imported} trades`);
      onImported();
    } catch (err) {
      const body = err.response?.data;
      setServerErrors([body?.error || "Import failed", ...(body?.details || [])]);
    } finally {
      setImporting(false);
    }
  };

  const canImport = parsed && parsed.trades.length > 0 && parsed.errors.length === 0;

  return (
    <Modal title="Import trades from CSV" onClose={onClose} wide>
      <p className="text-sm text-gray-400">
        Upload a Zerodha tradebook, a Groww order history export, or the Zelbi template. The whole file is
        imported together, so fix any errors and upload again.
      </p>
      <button type="button" onClick={downloadTemplate} className="mt-2 text-sm text-primary underline">
        Download the template
      </button>

      <div className="mt-4">
        <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="sr-only" id="trade-file" />
        <label
          htmlFor="trade-file"
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#2a2a2a] p-6 cursor-pointer hover:border-primary/50"
        >
          <FaFileImport className="text-2xl text-primary" />
          <span className="text-sm text-gray-300">{fileName || "Choose a CSV file"}</span>
        </label>
      </div>

      {parsed && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-gray-300">
            Found {parsed.trades.length} trades
            {parsed.skipped > 0 && `, skipped ${parsed.skipped} rejected or cancelled orders`}.
          </p>
          {parsed.trades.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-[#1a1a1a]">
              <table className="w-full text-xs">
                <thead className="text-gray-400">
                  <tr>{["Symbol", "Type", "Qty", "Price", "Date"].map((h) => <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {parsed.trades.slice(0, 5).map((t, i) => (
                    <tr key={i} className="border-t border-[#1a1a1a]">
                      <td className="px-3 py-2">{t.symbol}</td>
                      <td className="px-3 py-2 capitalize">{t.type}</td>
                      <td className="px-3 py-2">{t.quantity}</td>
                      <td className="px-3 py-2">{t.price}</td>
                      <td className="px-3 py-2">{t.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {[...parsed.errors, ...serverErrors].length > 0 && (
            <ul className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 space-y-1 text-red-200 max-h-40 overflow-y-auto">
              {[...parsed.errors, ...serverErrors].slice(0, 20).map((error, i) => <li key={i}>{error}</li>)}
            </ul>
          )}
        </div>
      )}

      <div className="flex justify-end gap-3 pt-5">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5">Cancel</button>
        <button
          type="button"
          onClick={handleImport}
          disabled={!canImport || importing}
          className="px-5 py-2 rounded-lg bg-primary text-black font-medium hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {importing ? "Importing…" : "Import"}
        </button>
      </div>
    </Modal>
  );
};

const emptyTrade = (overrides = {}) => ({
  type: "buy", symbol: "", quantity: "", price: "", fees: "", date: today(), notes: "", ...overrides,
});

const Portfolio = () => {
  const { token } = useSelector((state) => state.auth);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradeForm, setTradeForm] = useState(null); // { initial, id? }
  const [tradesSymbol, setTradesSymbol] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadPortfolio = useCallback(async () => {
    try {
      setError(null);
      const { data } = await axios.get(`${API_URL}/portfolio`, authHeaders);
      setPortfolio(data);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't load your portfolio. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    document.title = "Zelbi | Portfolio";
    loadPortfolio();
  }, [loadPortfolio]);

  const holdings = useMemo(() => portfolio?.holdings ?? [], [portfolio]);
  const headline = portfolio?.summary?.[0];
  const otherCurrencies = portfolio?.summary?.slice(1) ?? [];
  const realized = portfolio?.realizedPnl ?? [];
  const holdingLimit = portfolio?.holdingLimit ?? -1;
  const atLimit = holdingLimit !== -1 && holdings.length >= holdingLimit;

  const allocation = useMemo(() => {
    if (!headline) return null;
    const items = holdings.filter((h) => h.currency === headline.currency && h.marketValue > 0);
    return { labels: items.map((h) => h.symbol), series: items.map((h) => h.marketValue) };
  }, [holdings, headline]);

  const saveTrade = async (form) => {
    const payload = {
      type: form.type,
      quantity: form.quantity,
      price: form.price,
      fees: form.fees,
      date: form.date,
      notes: form.notes,
    };
    try {
      if (tradeForm.id) {
        await axios.put(`${API_URL}/portfolio/transactions/${tradeForm.id}`, payload, authHeaders);
        toast.success("Trade updated");
      } else {
        await axios.post(`${API_URL}/portfolio/transactions`, { ...payload, symbol: form.symbol }, authHeaders);
        toast.success(`${form.type === "buy" ? "Bought" : "Sold"} ${form.quantity} ${form.symbol}`);
      }
      setTradeForm(null);
      loadPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't save the trade");
    }
  };

  const editTrade = (trade) =>
    setTradeForm({
      id: trade._id,
      initial: {
        type: trade.type,
        symbol: trade.symbol,
        quantity: String(trade.quantity),
        price: String(trade.price),
        fees: trade.fees ? String(trade.fees) : "",
        date: trade.date.slice(0, 10),
        notes: trade.notes || "",
      },
    });

  const exportTrades = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/portfolio/transactions`, authHeaders);
      const rows = [...data.transactions].reverse().map((t) => [
        t.symbol, t.type, t.quantity, t.price, t.date.slice(0, 10), t.fees || 0, t.notes || "",
      ]);
      downloadCsv(`zelbi-trades-${today()}.csv`, toCsv(TEMPLATE_HEADER, rows));
    } catch {
      toast.error("Couldn't export trades");
    }
  };

  const exportHoldings = () => {
    const rows = holdings.map((h) => [
      h.symbol, h.name || "", h.quantity, h.avgPrice, h.currentPrice ?? "", h.currency || "",
      h.costBasis ?? "", h.marketValue ?? "", h.pnl ?? "", h.pnlPercent ?? "",
    ]);
    downloadCsv(
      `zelbi-holdings-${today()}.csv`,
      toCsv(["symbol", "name", "quantity", "avg_price", "current_price", "currency", "invested", "value", "pnl", "pnl_percent"], rows)
    );
  };

  const chartOptions = {
    chart: { type: "donut", background: "transparent" },
    labels: allocation?.labels ?? [],
    colors: CHART_COLORS,
    legend: { position: "bottom", labels: { colors: "#d1d5db" } },
    dataLabels: { enabled: false },
    stroke: { colors: ["#0a0a0a"] },
    tooltip: { y: { formatter: (value) => formatMoney(value, headline?.currency) } },
    plotOptions: { pie: { donut: { size: "65%" } } },
    theme: { mode: "dark" },
  };

  const secondaryButton = "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#141414] border border-[#2a2a2a] text-gray-200 hover:border-primary/50 disabled:opacity-40";

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Portfolio</h1>
            <p className="text-gray-400 mt-1">Record your trades and track holdings at live market prices.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowImport(true)} className={secondaryButton}>
              <FaFileImport /> Import CSV
            </button>
            <button type="button" onClick={exportTrades} disabled={holdings.length === 0 && realized.length === 0} className={secondaryButton}>
              <FaDownload /> Export trades
            </button>
            <button
              type="button"
              onClick={() => setTradeForm({ initial: emptyTrade() })}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover disabled:opacity-40"
            >
              <FaPlus /> Add trade
            </button>
          </div>
        </div>

        {atLimit && (
          <div className="mb-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
            The free plan tracks up to {holdingLimit} holdings.{" "}
            <Link to="/pricing" className="underline font-medium">Upgrade to Pro</Link> for unlimited tracking.
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] animate-pulse" />)}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-200">{error}</p>
            <button type="button" onClick={loadPortfolio} className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">Try again</button>
          </div>
        ) : holdings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2a2a2a] p-10 sm:p-16 text-center">
            <FaWallet className="mx-auto text-4xl text-primary" />
            <h2 className="mt-4 text-xl font-semibold">No holdings yet</h2>
            <p className="mt-2 text-gray-400 max-w-md mx-auto">
              Add your buy and sell trades, or import them from your broker, to see live value, profit and loss, and capital gains tax.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={() => setTradeForm({ initial: emptyTrade() })} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover">
                <FaPlus /> Add your first trade
              </button>
              <button type="button" onClick={() => setShowImport(true)} className={secondaryButton}>
                <FaFileImport /> Import CSV
              </button>
            </div>
            {realized.length > 0 && (
              <p className="mt-6 text-sm text-gray-400">
                Realized P&L from past trades:{" "}
                {realized.map((r) => formatMoney(r.pnl, r.currency)).join(", ")}.{" "}
                <Link to="/tax-calculator" className="underline text-primary">See capital gains</Link>
              </p>
            )}
          </div>
        ) : (
          <>
            {headline && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                <StatTile label="Current value" value={formatMoney(headline.marketValue, headline.currency)} />
                <StatTile label="Invested" value={formatMoney(headline.costBasis, headline.currency)} />
                <StatTile label="Unrealized P&L" value={formatMoney(headline.pnl, headline.currency)} sub={formatPercent(headline.pnlPercent)} subClass={changeColor(headline.pnl)} />
                <StatTile label="Today" value={formatMoney(headline.dayChange, headline.currency)} sub={formatPercent(headline.dayChangePercent)} subClass={changeColor(headline.dayChange)} />
              </div>
            )}
            {otherCurrencies.length > 0 && (
              <p className="text-sm text-gray-400 mb-2">
                Also holding:{" "}
                {otherCurrencies.map((s) => `${formatMoney(s.marketValue, s.currency)} (${formatPercent(s.pnlPercent)} P&L)`).join(", ")}
              </p>
            )}
            {realized.length > 0 && (
              <p className="text-sm text-gray-400 mb-2">
                Realized P&L from sells:{" "}
                {realized.map((r) => (
                  <span key={r.currency} className={changeColor(r.pnl)}>{formatMoney(r.pnl, r.currency)} </span>
                ))}
                · <Link to="/tax-calculator" className="underline text-primary">See capital gains</Link>
              </p>
            )}
            <p className="text-xs text-gray-500 mb-8">Prices may be delayed. Average prices include buy charges and use FIFO for sells.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {allocation && allocation.series.length > 0 && (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
                  <h2 className="text-lg font-semibold mb-4">Allocation</h2>
                  <ReactApexChart options={chartOptions} series={allocation.series} type="donut" height={300} />
                </div>
              )}

              <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 ${allocation?.series.length ? "lg:col-span-2" : "lg:col-span-3"}`}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Holdings</h2>
                  <button type="button" onClick={exportHoldings} className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1">
                    <FaDownload /> CSV
                  </button>
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-[#1a1a1a]">
                        <th className="py-2 pr-3 font-medium">Stock</th>
                        <th className="py-2 px-3 font-medium text-right">Qty</th>
                        <th className="py-2 px-3 font-medium text-right">Avg price</th>
                        <th className="py-2 px-3 font-medium text-right">Price</th>
                        <th className="py-2 px-3 font-medium text-right">Value</th>
                        <th className="py-2 px-3 font-medium text-right">P&L</th>
                        <th className="py-2 pl-3"><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdings.map((h) => (
                        <tr key={h.symbol} className="border-b border-[#1a1a1a] last:border-0">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-white">{h.symbol}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[180px]">{h.name}</div>
                          </td>
                          <td className="py-3 px-3 text-right">{h.quantity}</td>
                          <td className="py-3 px-3 text-right">{formatMoney(h.avgPrice, h.currency)}</td>
                          <td className="py-3 px-3 text-right">
                            {h.currentPrice !== undefined ? (
                              <>
                                <div>{formatMoney(h.currentPrice, h.currency)}</div>
                                <div className={`text-xs ${changeColor(h.dayChangePercent)}`}>{formatPercent(h.dayChangePercent)}</div>
                              </>
                            ) : (
                              <span className="text-gray-500">Unavailable</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">{formatMoney(h.marketValue, h.currency)}</td>
                          <td className={`py-3 px-3 text-right ${changeColor(h.pnl)}`}>
                            <div>{formatMoney(h.pnl, h.currency)}</div>
                            <div className="text-xs">{formatPercent(h.pnlPercent)}</div>
                          </td>
                          <td className="py-3 pl-3 text-right whitespace-nowrap">
                            <button type="button" onClick={() => setTradeForm({ initial: emptyTrade({ type: "sell", symbol: h.symbol }) })} className="px-2 py-1 rounded-lg text-xs text-red-300 hover:bg-white/5">
                              Sell
                            </button>
                            <button type="button" onClick={() => setTradesSymbol(h.symbol)} aria-label={`View ${h.symbol} trades`} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                              <FaHistory />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="md:hidden space-y-3">
                  {holdings.map((h) => (
                    <li key={h.symbol} className="rounded-xl bg-[#141414] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-white">{h.symbol}</div>
                          <div className="text-xs text-gray-400 truncate">{h.name}</div>
                        </div>
                        <div className="flex shrink-0 items-center">
                          <button type="button" onClick={() => setTradeForm({ initial: emptyTrade({ type: "sell", symbol: h.symbol }) })} className="px-2 py-1 text-xs text-red-300">
                            Sell
                          </button>
                          <button type="button" onClick={() => setTradesSymbol(h.symbol)} aria-label={`View ${h.symbol} trades`} className="p-2 text-gray-400 hover:text-white">
                            <FaHistory />
                          </button>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                        <dt className="text-gray-400">Quantity</dt>
                        <dd className="text-right">{h.quantity} @ {formatMoney(h.avgPrice, h.currency)}</dd>
                        <dt className="text-gray-400">Value</dt>
                        <dd className="text-right">{formatMoney(h.marketValue, h.currency)}</dd>
                        <dt className="text-gray-400">P&L</dt>
                        <dd className={`text-right ${changeColor(h.pnl)}`}>{formatMoney(h.pnl, h.currency)} ({formatPercent(h.pnlPercent)})</dd>
                      </dl>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {tradeForm && (
        <TradeForm
          token={token}
          isEdit={Boolean(tradeForm.id)}
          initial={tradeForm.initial}
          onCancel={() => setTradeForm(null)}
          onSubmit={saveTrade}
        />
      )}

      {tradesSymbol && !tradeForm && (
        <TradesList
          symbol={tradesSymbol}
          authHeaders={authHeaders}
          onEdit={editTrade}
          onChanged={loadPortfolio}
          onClose={() => setTradesSymbol(null)}
        />
      )}

      {showImport && (
        <ImportDialog
          authHeaders={authHeaders}
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false);
            loadPortfolio();
          }}
        />
      )}
    </div>
  );
};

export default Portfolio;
