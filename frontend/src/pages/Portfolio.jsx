import axios from "axios";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { toast } from "react-hot-toast";
import { FaEdit, FaPlus, FaTrash, FaWallet } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const API_URL = `${process.env.REACT_APP_API_URL}/api`;

const CHART_COLORS = ["#3affa3", "#38bdf8", "#facc15", "#f472b6", "#a78bfa", "#fb923c", "#34d399", "#f87171"];

const formatMoney = (value, currency) => {
  if (value === null || value === undefined) return "—";
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

const EMPTY_FORM = { symbol: "", quantity: "", avgPrice: "", buyDate: "", notes: "" };

const StatTile = ({ label, value, sub, subClass = "text-gray-400" }) => (
  <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-4 sm:p-5">
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-2 text-xl sm:text-2xl font-semibold text-white">{value}</p>
    {sub && <p className={`mt-1 text-sm ${subClass}`}>{sub}</p>}
  </div>
);

const HoldingForm = ({ initial, isEdit, onCancel, onSubmit, token }) => {
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
    const symbol = result.country === "India" && result.exchange
      ? `${result.symbol}:${result.exchange}`
      : result.symbol;
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

  const inputClass =
    "w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
      role="presentation"
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="holding-form-title"
        className="w-full max-w-md bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6 space-y-4"
      >
        <h2 id="holding-form-title" className="text-xl font-semibold text-white">
          {isEdit ? `Edit ${form.symbol}` : "Add holding"}
        </h2>

        {!isEdit && (
          <div className="relative">
            <label htmlFor="holding-symbol" className="block text-sm text-gray-300 mb-1">Symbol</label>
            <input
              id="holding-symbol"
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
                    <button
                      type="button"
                      onClick={() => pickResult(result)}
                      className="w-full text-left px-3 py-2 hover:bg-white/5"
                    >
                      <span className="font-medium text-white">{result.symbol}</span>
                      <span className="ml-2 text-sm text-gray-400">
                        {result.instrument_name} · {result.exchange}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="holding-qty" className="block text-sm text-gray-300 mb-1">Quantity</label>
            <input id="holding-qty" type="number" min="0" step="any" required value={form.quantity} onChange={update("quantity")} className={inputClass} />
          </div>
          <div>
            <label htmlFor="holding-price" className="block text-sm text-gray-300 mb-1">Avg buy price</label>
            <input id="holding-price" type="number" min="0" step="any" required value={form.avgPrice} onChange={update("avgPrice")} className={inputClass} />
          </div>
        </div>

        <div>
          <label htmlFor="holding-date" className="block text-sm text-gray-300 mb-1">Buy date (optional)</label>
          <input
            id="holding-date"
            type="date"
            max={new Date().toISOString().slice(0, 10)}
            value={form.buyDate}
            onChange={update("buyDate")}
            className={`${inputClass} [color-scheme:dark]`}
          />
        </div>

        <div>
          <label htmlFor="holding-notes" className="block text-sm text-gray-300 mb-1">Notes (optional)</label>
          <textarea id="holding-notes" rows="2" maxLength={500} value={form.notes} onChange={update("notes")} className={inputClass} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 rounded-lg bg-primary text-black font-medium hover:bg-primary-hover disabled:opacity-50"
          >
            {saving ? "Saving…" : isEdit ? "Save changes" : "Add holding"}
          </button>
        </div>
      </form>
    </div>
  );
};

const Portfolio = () => {
  const { token } = useSelector((state) => state.auth);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null, "new", or a holding

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
  const holdingLimit = portfolio?.holdingLimit ?? -1;
  const atLimit = holdingLimit !== -1 && holdings.length >= holdingLimit;

  const allocation = useMemo(() => {
    if (!headline) return null;
    const items = holdings.filter((h) => h.currency === headline.currency && h.marketValue > 0);
    return {
      labels: items.map((h) => h.symbol),
      series: items.map((h) => h.marketValue),
    };
  }, [holdings, headline]);

  const saveHolding = async (form) => {
    const payload = {
      quantity: form.quantity,
      avgPrice: form.avgPrice,
      buyDate: form.buyDate || undefined,
      notes: form.notes,
    };
    try {
      if (editing === "new") {
        await axios.post(`${API_URL}/portfolio/holdings`, { ...payload, symbol: form.symbol }, authHeaders);
        toast.success(`${form.symbol} added`);
      } else {
        await axios.put(`${API_URL}/portfolio/holdings/${editing._id}`, payload, authHeaders);
        toast.success(`${editing.symbol} updated`);
      }
      setEditing(null);
      loadPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't save the holding");
    }
  };

  const removeHolding = async (holding) => {
    if (!window.confirm(`Remove ${holding.symbol} from your portfolio?`)) return;
    try {
      await axios.delete(`${API_URL}/portfolio/holdings/${holding._id}`, authHeaders);
      toast.success(`${holding.symbol} removed`);
      loadPortfolio();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't remove the holding");
    }
  };

  const openEdit = (holding) =>
    setEditing({
      ...holding,
      form: {
        symbol: holding.symbol,
        quantity: String(holding.quantity),
        avgPrice: String(holding.avgPrice),
        buyDate: holding.buyDate ? holding.buyDate.slice(0, 10) : "",
        notes: holding.notes || "",
      },
    });

  const chartOptions = {
    chart: { type: "donut", background: "transparent" },
    labels: allocation?.labels ?? [],
    colors: CHART_COLORS,
    legend: { position: "bottom", labels: { colors: "#d1d5db" } },
    dataLabels: { enabled: false },
    stroke: { colors: ["#0a0a0a"] },
    tooltip: { y: { formatter: (value) => formatMoney(value, headline?.currency || "USD") } },
    plotOptions: { pie: { donut: { size: "65%" } } },
    theme: { mode: "dark" },
  };

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Portfolio</h1>
            <p className="text-gray-400 mt-1">Track your holdings at live market prices.</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing("new")}
            disabled={atLimit || loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <FaPlus /> Add holding
          </button>
        </div>

        {atLimit && (
          <div className="mb-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3 text-sm text-yellow-100">
            The free plan tracks up to {holdingLimit} holdings.{" "}
            <Link to="/pricing" className="underline font-medium">Upgrade to Pro</Link> for unlimited tracking.
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-200">{error}</p>
            <button type="button" onClick={loadPortfolio} className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
              Try again
            </button>
          </div>
        ) : holdings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#2a2a2a] p-10 sm:p-16 text-center">
            <FaWallet className="mx-auto text-4xl text-primary" />
            <h2 className="mt-4 text-xl font-semibold">No holdings yet</h2>
            <p className="mt-2 text-gray-400 max-w-md mx-auto">
              Add the stocks you own to see their live value, profit and loss, and how your money is spread out.
            </p>
            <button
              type="button"
              onClick={() => setEditing("new")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover"
            >
              <FaPlus /> Add your first holding
            </button>
          </div>
        ) : (
          <>
            {headline && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
                <StatTile label="Current value" value={formatMoney(headline.marketValue, headline.currency)} />
                <StatTile label="Invested" value={formatMoney(headline.costBasis, headline.currency)} />
                <StatTile
                  label="Total P&L"
                  value={formatMoney(headline.pnl, headline.currency)}
                  sub={formatPercent(headline.pnlPercent)}
                  subClass={changeColor(headline.pnl)}
                />
                <StatTile
                  label="Today"
                  value={formatMoney(headline.dayChange, headline.currency)}
                  sub={formatPercent(headline.dayChangePercent)}
                  subClass={changeColor(headline.dayChange)}
                />
              </div>
            )}
            {otherCurrencies.length > 0 && (
              <p className="text-sm text-gray-400 mb-2">
                Also holding:{" "}
                {otherCurrencies
                  .map((s) => `${formatMoney(s.marketValue, s.currency)} (${formatPercent(s.pnlPercent)} P&L)`)
                  .join(", ")}
              </p>
            )}
            <p className="text-xs text-gray-500 mb-8">Prices may be delayed. Totals are shown per trading currency.</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {allocation && allocation.series.length > 0 && (
                <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
                  <h2 className="text-lg font-semibold mb-4">Allocation</h2>
                  <ReactApexChart options={chartOptions} series={allocation.series} type="donut" height={300} />
                </div>
              )}

              <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 ${allocation?.series.length ? "lg:col-span-2" : "lg:col-span-3"}`}>
                <h2 className="text-lg font-semibold mb-4">Holdings</h2>

                {/* Table on larger screens */}
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
                        <tr key={h._id} className="border-b border-[#1a1a1a] last:border-0">
                          <td className="py-3 pr-3">
                            <div className="font-medium text-white">{h.symbol}</div>
                            <div className="text-xs text-gray-400 truncate max-w-[180px]">{h.name}</div>
                          </td>
                          <td className="py-3 px-3 text-right">{h.quantity}</td>
                          <td className="py-3 px-3 text-right">{formatMoney(h.avgPrice, h.currency || "USD")}</td>
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
                            <button type="button" onClick={() => openEdit(h)} aria-label={`Edit ${h.symbol}`} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5">
                              <FaEdit />
                            </button>
                            <button type="button" onClick={() => removeHolding(h)} aria-label={`Remove ${h.symbol}`} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5">
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Cards on phones */}
                <ul className="md:hidden space-y-3">
                  {holdings.map((h) => (
                    <li key={h._id} className="rounded-xl bg-[#141414] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-medium text-white">{h.symbol}</div>
                          <div className="text-xs text-gray-400 truncate">{h.name}</div>
                        </div>
                        <div className="flex shrink-0">
                          <button type="button" onClick={() => openEdit(h)} aria-label={`Edit ${h.symbol}`} className="p-2 text-gray-400 hover:text-white">
                            <FaEdit />
                          </button>
                          <button type="button" onClick={() => removeHolding(h)} aria-label={`Remove ${h.symbol}`} className="p-2 text-gray-400 hover:text-red-400">
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                        <dt className="text-gray-400">Quantity</dt>
                        <dd className="text-right">{h.quantity} @ {formatMoney(h.avgPrice, h.currency || "USD")}</dd>
                        <dt className="text-gray-400">Value</dt>
                        <dd className="text-right">{formatMoney(h.marketValue, h.currency)}</dd>
                        <dt className="text-gray-400">P&L</dt>
                        <dd className={`text-right ${changeColor(h.pnl)}`}>
                          {formatMoney(h.pnl, h.currency)} ({formatPercent(h.pnlPercent)})
                        </dd>
                      </dl>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        )}
      </div>

      {editing && (
        <HoldingForm
          token={token}
          isEdit={editing !== "new"}
          initial={editing === "new" ? EMPTY_FORM : editing.form}
          onCancel={() => setEditing(null)}
          onSubmit={saveHolding}
        />
      )}
    </div>
  );
};

export default Portfolio;
