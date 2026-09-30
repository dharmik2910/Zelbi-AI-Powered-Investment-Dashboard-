import axios from "axios";
import { useCallback, useEffect, useState } from "react";
import { FaDownload, FaWallet } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { downloadCsv, toCsv } from "../utils/csv";

const inr = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value || 0);

const money = (value, currency) => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 2 }).format(value);
  } catch {
    return `${value} ${currency}`;
  }
};

const percent = (rate) => `${(rate * 100).toFixed(1).replace(/\.0$/, "")}%`;

const Row = ({ label, value, className = "text-white" }) => (
  <div className="flex items-center justify-between py-2 text-sm">
    <span className="text-gray-400">{label}</span>
    <span className={className}>{value}</span>
  </div>
);

/**
 * Capital gains estimate for a financial year, worked out from the trades in the user's portfolio.
 */
const TradeTaxSummary = () => {
  const { token } = useSelector((state) => state.auth);
  const [fy, setFy] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async (financialYear) => {
    setLoading(true);
    setError(null);
    try {
      const { data: body } = await axios.get(`${process.env.REACT_APP_API_URL}/api/portfolio/tax`, {
        params: financialYear ? { fy: financialYear } : {},
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(body);
      setFy(body.financialYear);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't calculate capital gains from your trades.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const exportCsv = () => {
    const header = ["symbol", "currency", "quantity", "buy_date", "sell_date", "holding_days", "term", "cost", "proceeds", "gain", "tax_rate"];
    const rows = data.trades.map((t) => [
      t.symbol, t.currency || "", t.quantity, t.buyDate.slice(0, 10), t.sellDate.slice(0, 10), t.holdingDays,
      t.term, t.cost, t.proceeds, t.gain, t.rate === null ? "slab / not calculated" : t.rate,
    ]);
    downloadCsv(`zelbi-capital-gains-FY${data.financialYear}.csv`, toCsv(header, rows));
  };

  const indian = data?.indian;
  const hasTrades = data?.trades?.length > 0;

  return (
    <section className="bg-gradient-to-br from-[#101010] to-[#0a0a0a] rounded-2xl p-6 md:p-8 border border-[#1a1a1a] shadow-xl mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/5 p-2 rounded-lg border border-white/10">
            <FaWallet className="text-xl text-white" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">From my trades</h2>
            <p className="text-sm text-gray-400">Capital gains from sells in your portfolio, matched with FIFO.</p>
          </div>
        </div>
        {data && (
          <div className="flex items-center gap-2">
            <label htmlFor="tax-fy" className="text-sm text-gray-400">Financial year</label>
            <select
              id="tax-fy"
              value={fy}
              onChange={(e) => load(e.target.value)}
              className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
            >
              {data.availableYears.map((year) => <option key={year} value={year}>FY {year}</option>)}
            </select>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!hasTrades}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#141414] border border-[#2a2a2a] text-gray-200 hover:border-primary/50 disabled:opacity-40"
            >
              <FaDownload /> CSV
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" aria-busy="true" />
      ) : error ? (
        <p className="text-red-300">{error}</p>
      ) : !hasTrades ? (
        <p className="text-gray-400">
          No sells recorded in FY {data.financialYear}.{" "}
          <Link to="/portfolio" className="text-primary underline">Add trades in your portfolio</Link> to see your capital gains here.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-xl bg-black/30 border border-white/5 p-5">
              <h3 className="font-semibold text-white mb-2">Indian listed shares</h3>
              <div className="divide-y divide-white/5">
                <Row label="Short-term gains" value={inr(indian.shortTermGains)} className="text-green-400" />
                <Row label="Short-term losses" value={inr(-indian.shortTermLosses)} className="text-red-400" />
                <Row label="Long-term gains" value={inr(indian.longTermGains)} className="text-green-400" />
                <Row label="Long-term losses" value={inr(-indian.longTermLosses)} className="text-red-400" />
                <Row label={`LTCG exemption used (of ${inr(indian.ltcgExemption)})`} value={inr(indian.exemptionUsed)} />
              </div>
            </div>

            <div className="rounded-xl bg-black/30 border border-white/5 p-5">
              <h3 className="font-semibold text-white mb-2">Estimated tax</h3>
              <div className="divide-y divide-white/5">
                {indian.taxBreakdown.length === 0 ? (
                  <Row label="Taxable gains" value={inr(0)} />
                ) : (
                  indian.taxBreakdown.map((b) => (
                    <Row
                      key={`${b.term}-${b.rate}`}
                      label={`${b.term === "short" ? "STCG" : "LTCG"} ${inr(b.taxable)} at ${percent(b.rate)}`}
                      value={inr(b.tax)}
                    />
                  ))
                )}
                <Row label="Total (before cess and surcharge)" value={inr(indian.estimatedTax)} className="text-lg font-semibold text-white" />
                {(indian.lossesToCarryForward.shortTerm > 0 || indian.lossesToCarryForward.longTerm > 0) && (
                  <Row
                    label="Losses you can carry forward"
                    value={`ST ${inr(indian.lossesToCarryForward.shortTerm)} · LT ${inr(indian.lossesToCarryForward.longTerm)}`}
                  />
                )}
              </div>
            </div>
          </div>

          {data.foreign.length > 0 && (
            <div className="mt-6 rounded-xl bg-black/30 border border-white/5 p-5 text-sm">
              <h3 className="font-semibold text-white mb-2">Foreign shares</h3>
              {data.foreign.map((f) => (
                <p key={f.currency} className="text-gray-300">
                  {f.currency}: short-term {money(f.shortTermGain, f.currency)}, long-term {money(f.longTermGain, f.currency)}
                </p>
              ))}
              <p className="text-gray-400 mt-2">
                Foreign shares are long-term after 24 months. Convert gains to INR at the SBI rate on each sale date;
                short-term gains are taxed at your slab rate and long-term gains at 12.5%.
              </p>
            </div>
          )}

          <details className="mt-6 text-sm">
            <summary className="cursor-pointer text-gray-300">Show {data.trades.length} matched sells</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-gray-400 text-left">
                  <tr>
                    {["Symbol", "Qty", "Bought", "Sold", "Held", "Term", "Gain"].map((h) => <th key={h} className="py-2 pr-4 font-medium">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.trades.map((t, i) => (
                    <tr key={i} className="border-t border-white/5">
                      <td className="py-2 pr-4">{t.symbol}</td>
                      <td className="py-2 pr-4">{t.quantity}</td>
                      <td className="py-2 pr-4">{new Date(t.buyDate).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{new Date(t.sellDate).toLocaleDateString()}</td>
                      <td className="py-2 pr-4">{t.holdingDays}d</td>
                      <td className="py-2 pr-4 capitalize">{t.term}</td>
                      <td className={`py-2 pr-4 ${t.gain >= 0 ? "text-green-400" : "text-red-400"}`}>{money(t.gain, t.currency || "INR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <p className="mt-6 text-xs text-gray-500">
            Estimate only, not tax advice. Uses the rates in force on each sale date (STCG 15%/LTCG 10% before 23 July 2024,
            20%/12.5% after). Doesn't include grandfathering for shares bought before February 2018, surcharge, cess,
            or losses brought forward from earlier years.
          </p>
        </>
      )}
    </section>
  );
};

export default TradeTaxSummary;
