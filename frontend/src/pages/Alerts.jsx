import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { FaBell, FaTrash } from "react-icons/fa";
import { useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";

const ALERTS_URL = `${process.env.REACT_APP_API_URL}/api/alerts`;

const formatDate = (value) =>
  new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const Alerts = () => {
  const { token } = useSelector((state) => state.auth);
  const [searchParams] = useSearchParams();
  const [alerts, setAlerts] = useState([]);
  const [alertLimit, setAlertLimit] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    symbol: (searchParams.get("symbol") || "").toUpperCase(),
    condition: "above",
    targetPrice: "",
    note: "",
  });

  const authHeaders = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);

  const loadAlerts = useCallback(async () => {
    try {
      setError(null);
      const { data } = await axios.get(ALERTS_URL, authHeaders);
      setAlerts(data.alerts || []);
      setAlertLimit(data.alertLimit ?? -1);
    } catch (err) {
      setError(err.response?.data?.error || "Couldn't load your alerts.");
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    document.title = "Zelbi | Price Alerts";
    loadAlerts();
  }, [loadAlerts]);

  const active = alerts.filter((a) => a.status === "active");
  const triggered = alerts.filter((a) => a.status === "triggered");
  const atLimit = alertLimit !== -1 && active.length >= alertLimit;

  const update = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: field === "symbol" ? e.target.value.toUpperCase() : e.target.value }));

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.post(ALERTS_URL, form, authHeaders);
      toast.success(`Alert set. ${form.symbol} is at ${data.currentPrice} now.`);
      setForm((prev) => ({ ...prev, targetPrice: "", note: "" }));
      loadAlerts();
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't create the alert");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (alert) => {
    try {
      await axios.delete(`${ALERTS_URL}/${alert._id}`, authHeaders);
      setAlerts((prev) => prev.filter((a) => a._id !== alert._id));
    } catch (err) {
      toast.error(err.response?.data?.error || "Couldn't delete the alert");
    }
  };

  const inputClass =
    "w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-primary";

  const AlertRow = ({ alert }) => (
    <li className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-white">
          <span className="font-medium">{alert.symbol}</span>{" "}
          <span className="text-gray-400">{alert.condition}</span>{" "}
          {alert.targetPrice} {alert.currency}
        </p>
        <p className="text-xs text-gray-400 truncate">
          {alert.status === "triggered"
            ? `Triggered at ${alert.triggeredPrice} on ${formatDate(alert.triggeredAt)}`
            : `Created ${formatDate(alert.createdAt)}`}
          {alert.note ? ` · ${alert.note}` : ""}
        </p>
      </div>
      <button
        type="button"
        onClick={() => handleDelete(alert)}
        aria-label={`Delete ${alert.symbol} alert`}
        className="shrink-0 p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5"
      >
        <FaTrash />
      </button>
    </li>
  );

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold">Price Alerts</h1>
        <p className="text-gray-400 mt-1 mb-8">
          Get an email when a stock crosses your target price. Prices are checked every few minutes.
        </p>

        <form onSubmit={handleCreate} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3">
            <div>
              <label htmlFor="alert-symbol" className="block text-sm text-gray-300 mb-1">Symbol</label>
              <input id="alert-symbol" required value={form.symbol} onChange={update("symbol")} placeholder="e.g. AAPL" className={inputClass} />
            </div>
            <div>
              <label htmlFor="alert-condition" className="block text-sm text-gray-300 mb-1">When price goes</label>
              <select id="alert-condition" value={form.condition} onChange={update("condition")} className={inputClass}>
                <option value="above">Above</option>
                <option value="below">Below</option>
              </select>
            </div>
            <div>
              <label htmlFor="alert-price" className="block text-sm text-gray-300 mb-1">Target price</label>
              <input id="alert-price" type="number" min="0" step="any" required value={form.targetPrice} onChange={update("targetPrice")} className={inputClass} />
            </div>
          </div>
          <div className="mt-3">
            <label htmlFor="alert-note" className="block text-sm text-gray-300 mb-1">Note (optional)</label>
            <input id="alert-note" maxLength={200} value={form.note} onChange={update("note")} placeholder="Why this price matters to you" className={inputClass} />
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-xs text-gray-400">
              {alertLimit === -1 ? "Unlimited alerts" : `${active.length} of ${alertLimit} active alerts used`}
              {atLimit && (
                <>
                  {" · "}
                  <Link to="/pricing" className="underline text-primary">Upgrade for more</Link>
                </>
              )}
            </p>
            <button
              type="submit"
              disabled={saving || atLimit}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-black font-medium hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <FaBell /> {saving ? "Setting…" : "Set alert"}
            </button>
          </div>
        </form>

        {loading ? (
          <div className="h-32 rounded-2xl bg-[#0a0a0a] border border-[#1a1a1a] animate-pulse" aria-busy="true" />
        ) : error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center">
            <p className="text-red-200">{error}</p>
            <button type="button" onClick={loadAlerts} className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20">
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
              <h2 className="text-lg font-semibold mb-2">Active</h2>
              {active.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No active alerts. Set one above.</p>
              ) : (
                <ul className="divide-y divide-[#1a1a1a]">
                  {active.map((alert) => <AlertRow key={alert._id} alert={alert} />)}
                </ul>
              )}
            </section>

            {triggered.length > 0 && (
              <section className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5">
                <h2 className="text-lg font-semibold mb-2">Triggered</h2>
                <ul className="divide-y divide-[#1a1a1a]">
                  {triggered.map((alert) => <AlertRow key={alert._id} alert={alert} />)}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
