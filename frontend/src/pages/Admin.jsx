import axios from "axios";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { toast } from "react-hot-toast";
import { FaArrowLeft, FaChartBar, FaCreditCard, FaDownload, FaEnvelope, FaEye, FaHistory, FaRobot, FaSearch, FaSignOutAlt, FaTrash, FaUserPlus, FaUsers } from "react-icons/fa";
import { BsPinAngle, BsPinAngleFill } from "react-icons/bs";
import { FiExternalLink } from "react-icons/fi";
import { SiGoogleanalytics, SiGoogletagmanager } from "react-icons/si";
import { HiMenu, HiX } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import logo from "../assets/Zelbi.png";
import { logout } from "../services/operations/authAPI";

const ADMIN_URL = `${process.env.REACT_APP_API_URL}/api/admin`;

const TABS = [
  { id: "overview", label: "Overview", icon: FaChartBar },
  { id: "pages", label: "Page views", icon: FaEye },
  { id: "users", label: "Users", icon: FaUsers },
  { id: "payments", label: "Payments", icon: FaCreditCard },
  { id: "emails", label: "Emails", icon: FaEnvelope },
  { id: "ai", label: "AI usage", icon: FaRobot },
  { id: "activity", label: "Activity log", icon: FaHistory },
];

const PLAN_BADGE = {
  free: "bg-gray-500/15 text-gray-300",
  pro: "bg-primary/15 text-primary",
  elite: "bg-yellow-400/15 text-yellow-300",
};

const inputClass =
  "w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-40";
const secondaryButton =
  "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[#141414] border border-[#2a2a2a] text-gray-200 hover:border-primary/50 disabled:opacity-40";
const primaryButton =
  "inline-flex items-center justify-center gap-2 px-5 py-2 rounded-lg bg-primary text-black font-medium hover:bg-primary-hover disabled:opacity-40";

const money = (amount, currency = "INR") => {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
};

const date = (value) => (value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
const dateTime = (value) => (value ? new Date(value).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const fullName = (u) => [u?.firstName, u?.lastName].filter(Boolean).join(" ") || "—";
const tomorrow = () => new Date(Date.now() + 86400000).toISOString().slice(0, 10);

const isPlanActive = (u) => u.subscriptionPlan !== "free" && u.subscriptionExpiry && new Date(u.subscriptionExpiry) > new Date();

const EMAIL_TYPE_LABELS = {
  otp: "Sign-up OTP",
  password_reset: "Password reset",
  password_changed: "Password changed",
  invite: "Account invite",
  payment_success: "Payment success",
  payment_failed: "Payment failed",
  price_alert: "Price alert",
  other: "Other",
};

const EMAIL_STATUS_STYLE = {
  sent: "bg-sky-500/15 text-sky-300",
  delivered: "bg-green-500/15 text-green-300",
  opened: "bg-primary/15 text-primary",
  clicked: "bg-primary/15 text-primary",
  deferred: "bg-yellow-400/15 text-yellow-300",
  failed: "bg-red-500/15 text-red-300",
  bounced: "bg-red-500/15 text-red-300",
  blocked: "bg-red-500/15 text-red-300",
  invalid: "bg-red-500/15 text-red-300",
  spam: "bg-red-500/15 text-red-300",
};

const EmailStatus = ({ status }) => (
  <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${EMAIL_STATUS_STYLE[status] || "bg-white/10 text-gray-300"}`}>
    {status}
  </span>
);

const compact = (n) => new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n || 0);
const usd = (n) => `$${(n || 0).toFixed((n || 0) < 1 ? 4 : 2)}`;

const errorMessage = (err, fallback) => err.response?.data?.message || fallback;

const Card = ({ children, className = "" }) => (
  <div className={`bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-5 ${className}`}>{children}</div>
);

const Stat = ({ label, value, sub }) => (
  <Card>
    <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
    <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    {sub && <p className="mt-1 text-sm text-gray-400">{sub}</p>}
  </Card>
);

const PlanBadge = ({ user }) => {
  const plan = isPlanActive(user) ? user.subscriptionPlan : "free";
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${PLAN_BADGE[plan]}`}>{plan}</span>;
};

const Modal = ({ label, onClose, children, wide = true }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={onClose} role="presentation">
    <div
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6`}
    >
      {children}
    </div>
  </div>
);

const Field = ({ id, label, children }) => (
  <div>
    <label htmlFor={id} className="block text-sm text-gray-300 mb-1">{label}</label>
    {children}
  </div>
);

const Pager = ({ page, pages, onPage }) =>
  pages > 1 && (
    <div className="flex items-center justify-end gap-3 pt-4 text-sm">
      <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className="px-3 py-1.5 rounded-lg bg-[#141414] disabled:opacity-40">
        Previous
      </button>
      <span className="text-gray-400">Page {page} of {pages}</span>
      <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className="px-3 py-1.5 rounded-lg bg-[#141414] disabled:opacity-40">
        Next
      </button>
    </div>
  );

const useAdminApi = () => {
  const { token } = useSelector((state) => state.auth);
  return useMemo(() => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    return {
      get: (path, params) => axios.get(`${ADMIN_URL}${path}`, { ...config, params }).then((r) => r.data),
      post: (path, body) => axios.post(`${ADMIN_URL}${path}`, body, config).then((r) => r.data),
      patch: (path, body) => axios.patch(`${ADMIN_URL}${path}`, body, config).then((r) => r.data),
      del: (path, body) => axios.delete(`${ADMIN_URL}${path}`, { ...config, data: body }).then((r) => r.data),
      // Downloads a CSV with the auth header, which a plain link can't send
      download: async (path, filename) => {
        const response = await axios.get(`${ADMIN_URL}${path}`, { ...config, responseType: "blob" });
        const url = URL.createObjectURL(response.data);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
      },
    };
  }, [token]);
};

/* --------------------------------- Clear logs --------------------------------- */

const ClearLogs = ({ kind, label, onCleared }) => {
  const api = useAdminApi();
  const [scope, setScope] = useState("30");
  const [busy, setBusy] = useState(false);

  const clear = async () => {
    const description = scope === "all" ? `all ${label}` : `${label} older than ${scope} days`;
    if (!window.confirm(`Delete ${description}? This can't be undone.`)) return;
    setBusy(true);
    try {
      const query = scope === "all" ? "all=true" : `olderThanDays=${scope}`;
      const data = await api.del(`/logs/${kind}?${query}`);
      toast.success(`Deleted ${data.deleted} entries`);
      onCleared();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't clear logs"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor={`clear-${kind}`} className="sr-only">Which {label} to delete</label>
      <select id={`clear-${kind}`} value={scope} onChange={(e) => setScope(e.target.value)} className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white text-sm">
        <option value="7">Older than 7 days</option>
        <option value="30">Older than 30 days</option>
        <option value="90">Older than 90 days</option>
        <option value="all">All</option>
      </select>
      <button type="button" disabled={busy} onClick={clear} className={`${secondaryButton} text-red-300`}>
        <FaTrash aria-hidden="true" /> {busy ? "Deleting…" : "Clear logs"}
      </button>
    </div>
  );
};

/* ---------------------------------- Overview ---------------------------------- */

const Overview = () => {
  const api = useAdminApi();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/stats").then((d) => setStats(d.stats)).catch((err) => setError(errorMessage(err, "Couldn't load stats")));
  }, [api]);

  if (error) return <p className="text-red-300">{error}</p>;
  if (!stats) return <div className="h-64 rounded-2xl bg-[#0a0a0a] animate-pulse" aria-busy="true" />;

  const paid = (stats.plans.pro || 0) + (stats.plans.elite || 0);
  const revenueText = (rows) => (rows.length ? rows.map((r) => money(r.amount, r.currency)).join(" + ") : money(0));

  const chartOptions = {
    chart: { type: "bar", background: "transparent", toolbar: { show: false } },
    colors: ["#3affa3"],
    xaxis: { categories: stats.signupsByDay.map((d) => d.date.slice(5)), labels: { style: { colors: "#9ca3af" } } },
    yaxis: { labels: { style: { colors: "#9ca3af" }, formatter: (v) => Math.round(v) } },
    grid: { borderColor: "#1f1f1f" },
    dataLabels: { enabled: false },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "60%" } },
    tooltip: { theme: "dark" },
    theme: { mode: "dark" },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total users" value={stats.users.total} sub={`+${stats.users.new7Days} this week · +${stats.users.new30Days} in 30 days`} />
        <Stat label="Paying users" value={paid} sub={`${stats.plans.pro} Pro · ${stats.plans.elite} Elite`} />
        <Stat label="Revenue (30 days)" value={revenueText(stats.revenue.last30Days)} sub={`All time ${revenueText(stats.revenue.allTime)}`} />
        <Stat label="Failed payments (30 days)" value={stats.failedPayments30Days} />
        <Stat label="AI prompts this cycle" value={stats.aiPromptsThisCycle} />
        <Stat label="Users with trades" value={stats.usersWithTrades} />
        <Stat label="Active price alerts" value={stats.activeAlerts} />
        <Stat label="Paid conversion" value={stats.users.total ? `${((paid / stats.users.total) * 100).toFixed(1)}%` : "—"} />
      </div>

      <Card>
        <h2 className="text-lg font-semibold mb-4">Sign-ups, last 30 days</h2>
        {stats.signupsByDay.length === 0 ? (
          <p className="text-gray-400 text-sm">No sign-ups in the last 30 days.</p>
        ) : (
          <ReactApexChart options={chartOptions} series={[{ name: "Sign-ups", data: stats.signupsByDay.map((d) => d.count) }]} type="bar" height={260} />
        )}
      </Card>
    </div>
  );
};

/* -------------------------------- Create user -------------------------------- */

const CreateUser = ({ onClose, onCreated }) => {
  const api = useAdminApi();
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "", subscriptionPlan: "free", subscriptionExpiry: "", role: "user",
  });
  const [saving, setSaving] = useState(false);
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const body = { ...form };
      if (!body.password) delete body.password;
      if (body.subscriptionPlan === "free" || !body.subscriptionExpiry) delete body.subscriptionExpiry;
      const data = await api.post("/users", body);
      toast.success(
        form.password ? "User created" : data.inviteSent ? "User created and invite email sent" : "User created, but the invite email failed. Send a password reset from their profile."
      );
      onCreated();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't create user"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal label="Add user" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <h2 className="text-xl font-semibold">Add user</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="new-first" label="First name">
            <input id="new-first" required value={form.firstName} onChange={update("firstName")} className={inputClass} />
          </Field>
          <Field id="new-last" label="Last name">
            <input id="new-last" value={form.lastName} onChange={update("lastName")} className={inputClass} />
          </Field>
          <Field id="new-email" label="Email">
            <input id="new-email" type="email" required value={form.email} onChange={update("email")} className={inputClass} />
          </Field>
          <Field id="new-password" label="Password (optional)">
            <input id="new-password" type="password" minLength={8} autoComplete="new-password" value={form.password} onChange={update("password")} placeholder="Leave blank to email an invite" className={inputClass} />
          </Field>
          <Field id="new-plan" label="Plan">
            <select id="new-plan" value={form.subscriptionPlan} onChange={update("subscriptionPlan")} className={inputClass}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </Field>
          <Field id="new-expiry" label="Plan active until">
            <input id="new-expiry" type="date" min={tomorrow()} disabled={form.subscriptionPlan === "free"} value={form.subscriptionPlan === "free" ? "" : form.subscriptionExpiry} onChange={update("subscriptionExpiry")} className={`${inputClass} [color-scheme:dark]`} />
          </Field>
          <Field id="new-role" label="Role">
            <select id="new-role" value={form.role} onChange={update("role")} className={inputClass}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
        </div>
        <p className="text-xs text-gray-500">
          Without a password, the user gets an email with a link (valid 7 days) to set one. Paid plans without a date get 30 days.
        </p>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5">Cancel</button>
          <button type="submit" disabled={saving} className={primaryButton}>{saving ? "Creating…" : "Create user"}</button>
        </div>
      </form>
    </Modal>
  );
};

/* -------------------------------- User detail -------------------------------- */

const UserDetail = ({ userId, onClose, onChanged }) => {
  const api = useAdminApi();
  const { user: me } = useSelector((state) => state.profile);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");

  const load = useCallback(() => {
    api.get(`/users/${userId}`).then((d) => {
      setData(d);
      setForm({
        firstName: d.user.firstName || "",
        lastName: d.user.lastName || "",
        email: d.user.email,
        subscriptionPlan: d.user.subscriptionPlan || "free",
        subscriptionExpiry: d.user.subscriptionExpiry ? d.user.subscriptionExpiry.slice(0, 10) : "",
        role: d.user.role || "user",
      });
    }).catch(() => toast.error("Couldn't load user"));
  }, [api, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (action, success) => {
    setBusy(true);
    try {
      await action();
      if (success) toast.success(success);
      load();
      onChanged();
      return true;
    } catch (err) {
      toast.error(errorMessage(err, "Something went wrong"));
      return false;
    } finally {
      setBusy(false);
    }
  };

  if (!data || !form) {
    return <Modal label="User details" onClose={onClose}><p className="text-gray-400">Loading…</p></Modal>;
  }

  const u = data.user;
  const isSelf = String(u._id) === String(me?._id);

  const save = () => {
    const body = {};
    ["firstName", "lastName", "email", "subscriptionPlan", "role"].forEach((field) => {
      if (form[field] !== (u[field] || (field === "subscriptionPlan" ? "free" : field === "role" ? "user" : ""))) body[field] = form[field];
    });
    if (form.subscriptionPlan !== "free" && form.subscriptionExpiry && form.subscriptionExpiry !== (u.subscriptionExpiry || "").slice(0, 10)) {
      body.subscriptionExpiry = form.subscriptionExpiry;
    }
    if (Object.keys(body).length === 0) {
      toast("No changes to save");
      return;
    }
    if (body.role && !window.confirm(`Change ${u.email}'s role to ${body.role}?`)) return;
    run(() => api.patch(`/users/${userId}`, body), "User updated");
  };

  const toggleBlock = () => {
    const blocking = !u.isBlocked;
    if (!window.confirm(blocking ? `Block ${u.email}? They'll be signed out and can't log in.` : `Unblock ${u.email}?`)) return;
    run(() => api.patch(`/users/${userId}`, { isBlocked: blocking }), blocking ? "User blocked" : "User unblocked");
  };

  const remove = async () => {
    const ok = await run(() => api.del(`/users/${userId}`, { confirmEmail }), `${u.email} was deleted`);
    if (ok) onClose();
  };

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Modal label="User details" onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-xl font-semibold truncate">{fullName(u)}</h2>
          <p className="text-gray-400 text-sm truncate">{u.email}</p>
          <p className="text-gray-500 text-xs mt-1">
            Joined {date(u.createdAt)} · {u.googleId ? "Google sign-in" : "Email sign-in"}
            {u.acceptedTerms ? "" : " · terms not accepted"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <PlanBadge user={u} />
          {u.isBlocked && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/15 text-red-300">Blocked</span>}
          {u.role === "admin" && <span className="text-xs text-yellow-300">Admin</span>}
        </div>
      </div>

      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        {[
          ["AI prompts used", u.aiPromptCount || 0],
          ["Trades", data.activity.tradeCount],
          ["Stocks traded", data.activity.symbolsTraded],
          ["Active alerts", data.activity.activeAlerts],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-[#141414] p-3">
            <dt className="text-gray-400 text-xs">{label}</dt>
            <dd className="text-white text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="mt-6">
        <h3 className="font-semibold mb-3">Details and access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field id="edit-first" label="First name">
            <input id="edit-first" value={form.firstName} onChange={update("firstName")} className={inputClass} />
          </Field>
          <Field id="edit-last" label="Last name">
            <input id="edit-last" value={form.lastName} onChange={update("lastName")} className={inputClass} />
          </Field>
          <Field id="edit-email" label="Email">
            <input id="edit-email" type="email" value={form.email} onChange={update("email")} className={inputClass} />
          </Field>
          <Field id="edit-role" label="Role">
            <select id="edit-role" value={form.role} disabled={isSelf} onChange={update("role")} className={inputClass}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field id="edit-plan" label="Plan">
            <select id="edit-plan" value={form.subscriptionPlan} onChange={update("subscriptionPlan")} className={inputClass}>
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="elite">Elite</option>
            </select>
          </Field>
          <Field id="edit-expiry" label="Plan active until">
            <input
              id="edit-expiry"
              type="date"
              min={tomorrow()}
              disabled={form.subscriptionPlan === "free"}
              value={form.subscriptionPlan === "free" ? "" : form.subscriptionExpiry}
              onChange={update("subscriptionExpiry")}
              className={`${inputClass} [color-scheme:dark]`}
            />
          </Field>
        </div>
        <p className="text-xs text-gray-500 mt-2">Changing a plan here doesn't charge or refund the user.</p>
        <div className="flex flex-wrap justify-end gap-2 mt-4">
          <button type="button" disabled={busy} onClick={() => window.confirm("Reset this user's AI prompt count to 0?") && run(() => api.patch(`/users/${userId}`, { resetPrompts: true }), "AI prompts reset")} className={secondaryButton}>
            Reset AI prompts
          </button>
          <button type="button" disabled={busy} onClick={() => window.confirm(`Email a password reset link to ${u.email}?`) && run(() => api.post(`/users/${userId}/password-reset`), `Reset email sent to ${u.email}`)} className={secondaryButton}>
            Send password reset
          </button>
          {!isSelf && (
            <button type="button" disabled={busy} onClick={toggleBlock} className={`${secondaryButton} ${u.isBlocked ? "" : "text-red-300"}`}>
              {u.isBlocked ? "Unblock" : "Block"}
            </button>
          )}
          <button type="button" disabled={busy} onClick={save} className={primaryButton}>Save changes</button>
        </div>
      </section>

      <section className="mt-6">
        <h3 className="font-semibold mb-2">AI usage, last 30 days</h3>
        <p className="text-sm text-gray-300">
          {data.aiUsage30Days.requests} requests · {compact(data.aiUsage30Days.promptTokens + data.aiUsage30Days.outputTokens)} tokens ·
          about {usd(data.aiUsage30Days.estimatedCostUsd)}
          {data.aiUsage30Days.errors > 0 && <span className="text-red-300"> · {data.aiUsage30Days.errors} failed</span>}
        </p>
      </section>

      <section className="mt-6">
        <h3 className="font-semibold mb-2">Recent emails</h3>
        {data.emails.length === 0 ? (
          <p className="text-sm text-gray-400">No emails logged.</p>
        ) : (
          <ul className="divide-y divide-[#1a1a1a] text-sm max-h-56 overflow-y-auto custom-scrollbar">
            {data.emails.map((e) => (
              <li key={e._id} className="flex items-center justify-between gap-4 py-2">
                <span className="min-w-0">
                  <span className="block truncate">{EMAIL_TYPE_LABELS[e.type] || e.subject}</span>
                  <span className="block text-xs text-gray-500">{dateTime(e.createdAt)}{e.error ? ` · ${e.error}` : ""}</span>
                </span>
                <EmailStatus status={e.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h3 className="font-semibold mb-2">Recent trades</h3>
        {data.trades.length === 0 ? (
          <p className="text-sm text-gray-400">No trades.</p>
        ) : (
          <ul className="divide-y divide-[#1a1a1a] text-sm max-h-56 overflow-y-auto custom-scrollbar">
            {data.trades.map((t) => (
              <li key={t._id} className="flex justify-between gap-4 py-2">
                <span>
                  <span className={`uppercase font-semibold ${t.type === "buy" ? "text-green-400" : "text-red-400"}`}>{t.type}</span>{" "}
                  {t.quantity} {t.symbol} @ {t.price}
                </span>
                <span className="text-gray-400">{date(t.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h3 className="font-semibold mb-2">Price alerts</h3>
        {data.alerts.length === 0 ? (
          <p className="text-sm text-gray-400">No alerts.</p>
        ) : (
          <ul className="divide-y divide-[#1a1a1a] text-sm">
            {data.alerts.map((a) => (
              <li key={a._id} className="flex items-center justify-between gap-4 py-2">
                <span>
                  {a.symbol} {a.condition} {a.targetPrice} {a.currency}
                  <span className={`ml-2 text-xs ${a.status === "active" ? "text-primary" : "text-gray-500"}`}>{a.status}</span>
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => window.confirm(`Delete the ${a.symbol} alert?`) && run(() => api.del(`/users/${userId}/alerts/${a._id}`), "Alert deleted")}
                  aria-label={`Delete ${a.symbol} alert`}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-white/5"
                >
                  <FaTrash />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6">
        <h3 className="font-semibold mb-2">Payments</h3>
        {data.payments.length === 0 ? (
          <p className="text-sm text-gray-400">No payments.</p>
        ) : (
          <ul className="divide-y divide-[#1a1a1a] text-sm">
            {data.payments.map((p) => (
              <li key={p._id} className="flex justify-between gap-4 py-2">
                <span className="capitalize">{p.plan} · {p.billingCycle} · {date(p.createdAt)}</span>
                <span className={p.status === "success" ? "text-green-400" : "text-red-400"}>
                  {money(p.amount / 100, p.currency)} {p.status === "success" ? "" : "(failed)"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isSelf && (
        <section className="mt-8 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
          <h3 className="font-semibold text-red-300">Delete user</h3>
          {u.role === "admin" ? (
            <p className="text-sm text-gray-400 mt-1">Change this user's role to User before deleting them.</p>
          ) : (
            <>
              <p className="text-sm text-gray-400 mt-1">
                Permanently deletes the account, portfolio, trades and alerts. Payment records are kept. This can't be undone.
              </p>
              <label htmlFor="confirm-delete" className="block text-sm text-gray-300 mt-3 mb-1">
                Type <span className="font-mono text-white">{u.email}</span> to confirm
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input id="confirm-delete" value={confirmEmail} onChange={(e) => setConfirmEmail(e.target.value)} autoComplete="off" className={inputClass} />
                <button
                  type="button"
                  disabled={busy || confirmEmail.trim().toLowerCase() !== u.email.toLowerCase()}
                  onClick={remove}
                  className="shrink-0 px-4 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-40"
                >
                  Delete user
                </button>
              </div>
            </>
          )}
        </section>
      )}

      <div className="flex justify-end pt-6">
        <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5">Close</button>
      </div>
    </Modal>
  );
};

/* ----------------------------------- Users ----------------------------------- */

const Users = () => {
  const api = useAdminApi();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ q: "", plan: "", status: "", page: 1 });
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    api.get("/users", {
      q: filters.q || undefined,
      plan: filters.plan || undefined,
      status: filters.status || undefined,
      role: filters.status === "admin" ? "admin" : undefined,
      page: filters.page,
    })
      .then(setData)
      .catch(() => toast.error("Couldn't load users"));
  }, [api, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSearch = useMemo(() => debounce((q) => setFilters((f) => ({ ...f, q, page: 1 })), 350), []);

  const exportCsv = () => api.download("/users/export", "zelbi-users.csv").catch(() => toast.error("Couldn't export users"));

  return (
    <Card>
      <div className="flex flex-col lg:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
          <label htmlFor="admin-user-search" className="sr-only">Search users</label>
          <input
            id="admin-user-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              updateSearch(e.target.value.trim());
            }}
            placeholder="Search by name or email"
            className={`${inputClass} pl-9`}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <label htmlFor="admin-plan-filter" className="sr-only">Filter by plan</label>
          <select id="admin-plan-filter" value={filters.plan} onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value, page: 1 }))} className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white">
            <option value="">All plans</option>
            <option value="free">Free</option>
            <option value="pro">Pro</option>
            <option value="elite">Elite</option>
          </select>
          <label htmlFor="admin-status-filter" className="sr-only">Filter by status</label>
          <select id="admin-status-filter" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white">
            <option value="">All users</option>
            <option value="blocked">Blocked</option>
            <option value="admin">Admins</option>
          </select>
          <button type="button" onClick={exportCsv} className={secondaryButton}><FaDownload /> Export</button>
          <button type="button" onClick={() => setCreating(true)} className={primaryButton}><FaUserPlus /> Add user</button>
        </div>
      </div>

      {!data ? (
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" aria-busy="true" />
      ) : data.users.length === 0 ? (
        <p className="text-gray-400 py-6 text-center">No users match.</p>
      ) : (
        <>
          <p className="text-xs text-gray-500 mb-2">{data.total} users</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#1a1a1a]">
                  <th className="py-2 pr-3 font-medium">User</th>
                  <th className="py-2 px-3 font-medium">Plan</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 px-3 font-medium text-right">AI prompts</th>
                  <th className="py-2 pl-3 font-medium text-right">Joined</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u._id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="py-2.5 pr-3">
                      <button type="button" onClick={() => setSelected(u._id)} className="text-left hover:text-primary">
                        <span className="block font-medium">
                          {fullName(u)}
                          {u.role === "admin" && <span className="ml-2 text-xs text-yellow-300">admin</span>}
                        </span>
                        <span className="block text-xs text-gray-400">{u.email}</span>
                      </button>
                    </td>
                    <td className="py-2.5 px-3">
                      <PlanBadge user={u} />
                      {isPlanActive(u) && <span className="block text-xs text-gray-500 mt-1">until {date(u.subscriptionExpiry)}</span>}
                    </td>
                    <td className="py-2.5 px-3">
                      {u.isBlocked ? <span className="text-red-300 text-xs">Blocked</span> : <span className="text-gray-400 text-xs">Active</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right">{u.aiPromptCount || 0}</td>
                    <td className="py-2.5 pl-3 text-right text-gray-400">{date(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} pages={data.pages} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
        </>
      )}

      {selected && <UserDetail userId={selected} onClose={() => setSelected(null)} onChanged={load} />}
      {creating && (
        <CreateUser
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </Card>
  );
};

/* ---------------------------------- Payments ---------------------------------- */

const Payments = () => {
  const api = useAdminApi();
  const [filters, setFilters] = useState({ status: "", page: 1 });
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/payments", { status: filters.status || undefined, page: filters.page })
      .then(setData)
      .catch(() => toast.error("Couldn't load payments"));
  }, [api, filters]);

  const exportCsv = () => api.download("/payments/export", "zelbi-payments.csv").catch(() => toast.error("Couldn't export payments"));

  return (
    <Card>
      <div className="flex justify-end gap-2 mb-4">
        <label htmlFor="admin-payment-status" className="sr-only">Filter by status</label>
        <select
          id="admin-payment-status"
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value, page: 1 })}
          className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
        >
          <option value="">All payments</option>
          <option value="success">Successful</option>
          <option value="failed">Failed</option>
        </select>
        <button type="button" onClick={exportCsv} className={secondaryButton}><FaDownload /> Export</button>
      </div>
      {!data ? (
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" aria-busy="true" />
      ) : data.payments.length === 0 ? (
        <p className="text-gray-400 py-6 text-center">No payments yet.</p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b border-[#1a1a1a]">
                  <th className="py-2 pr-3 font-medium">Date</th>
                  <th className="py-2 px-3 font-medium">User</th>
                  <th className="py-2 px-3 font-medium">Plan</th>
                  <th className="py-2 px-3 font-medium text-right">Amount</th>
                  <th className="py-2 px-3 font-medium">Status</th>
                  <th className="py-2 pl-3 font-medium">Razorpay order</th>
                </tr>
              </thead>
              <tbody>
                {data.payments.map((p) => (
                  <tr key={p._id} className="border-b border-[#1a1a1a] last:border-0">
                    <td className="py-2.5 pr-3 whitespace-nowrap">{dateTime(p.createdAt)}</td>
                    <td className="py-2.5 px-3">{p.userId?.email || <span className="text-gray-500">Deleted user</span>}</td>
                    <td className="py-2.5 px-3 capitalize">{p.plan} · {p.billingCycle}</td>
                    <td className="py-2.5 px-3 text-right">{money(p.amount / 100, p.currency)}</td>
                    <td className={`py-2.5 px-3 ${p.status === "success" ? "text-green-400" : "text-red-400"}`}>{p.status === "success" ? "Paid" : "Failed"}</td>
                    <td className="py-2.5 pl-3 text-xs text-gray-400 font-mono">{p.razorpay_order_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager page={data.page} pages={data.pages} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
        </>
      )}
    </Card>
  );
};

/* --------------------------------- Page views --------------------------------- */

const PageViews = () => {
  const api = useAdminApi();
  const [days, setDays] = useState(30);
  const [path, setPath] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    api.get("/page-views", { days, path: path || undefined, page })
      .then(setData)
      .catch(() => toast.error("Couldn't load page views"));
  }, [api, days, path, page, reloadKey]);

  const chartOptions = data && {
    chart: { type: "area", background: "transparent", toolbar: { show: false }, zoom: { enabled: false } },
    colors: ["#3affa3", "#38bdf8"],
    stroke: { width: 2, curve: "smooth" },
    fill: { type: "gradient", gradient: { opacityFrom: 0.3, opacityTo: 0 } },
    xaxis: { categories: data.byDay.map((d) => d.date.slice(5)), labels: { style: { colors: "#9ca3af" } } },
    yaxis: { labels: { style: { colors: "#9ca3af" }, formatter: (v) => Math.round(v) } },
    grid: { borderColor: "#1f1f1f" },
    dataLabels: { enabled: false },
    legend: { labels: { colors: "#d1d5db" } },
    tooltip: { theme: "dark" },
    theme: { mode: "dark" },
  };

  const devices = data?.devices || {};
  const deviceTotal = Object.values(devices).reduce((a, b) => a + b, 0) || 1;
  const pct = (n) => `${Math.round(((n || 0) / deviceTotal) * 100)}%`;

  const filterPath = (value) => {
    setPath(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <ClearLogs kind="page-views" label="page view logs" onCleared={() => setReloadKey((k) => k + 1)} />
        <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1" role="group" aria-label="Time range">
          {[1, 7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={`px-3 py-1.5 rounded-lg text-sm ${days === d ? "bg-primary text-black font-medium" : "text-gray-300 hover:bg-white/5"}`}
            >
              {d === 1 ? "Today" : `${d} days`}
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="h-64 rounded-2xl bg-[#0a0a0a] animate-pulse" aria-busy="true" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Page views" value={compact(data.totals.views)} />
            <Stat label="Visitors" value={compact(data.totals.visitors)} sub="Browser sessions" />
            <Stat label="Signed-in users" value={data.totals.signedInUsers} sub={`${compact(data.totals.signedInViews)} views while signed in`} />
            <Stat label="Devices" value={pct(devices.mobile)} sub={`mobile · ${pct(devices.desktop)} desktop · ${pct(devices.tablet)} tablet`} />
          </div>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Views per day</h2>
            {data.byDay.length === 0 ? (
              <p className="text-gray-400 text-sm">No page views in this period.</p>
            ) : (
              <ReactApexChart
                options={chartOptions}
                series={[
                  { name: "Views", data: data.byDay.map((d) => d.views) },
                  { name: "Visitors", data: data.byDay.map((d) => d.visitors) },
                ]}
                type="area"
                height={260}
              />
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <h2 className="text-lg font-semibold mb-3">Top pages</h2>
              {data.topPages.length === 0 ? (
                <p className="text-gray-400 text-sm">No page views yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-[#1a1a1a]">
                      <th className="py-2 pr-3 font-medium">Page</th>
                      <th className="py-2 px-3 font-medium text-right">Views</th>
                      <th className="py-2 pl-3 font-medium text-right">Visitors</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topPages.map((p) => (
                      <tr key={p.path} className="border-b border-[#1a1a1a] last:border-0">
                        <td className="py-2 pr-3">
                          <button type="button" onClick={() => filterPath(p.path)} className="font-mono text-left hover:text-primary" title="Show visits to this page">
                            {p.path}
                          </button>
                        </td>
                        <td className="py-2 px-3 text-right">{p.views}</td>
                        <td className="py-2 pl-3 text-right">{p.visitors}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-3">Where visitors come from</h2>
              {data.referrers.length === 0 ? (
                <p className="text-gray-400 text-sm">No outside referrers yet. Direct visits and links within Zelbi aren't listed.</p>
              ) : (
                <ul className="divide-y divide-[#1a1a1a] text-sm">
                  {data.referrers.map((r) => (
                    <li key={r.domain} className="flex justify-between py-2">
                      <span className="truncate">{r.domain}</span>
                      <span>{r.views}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h2 className="text-lg font-semibold">Recent visits{path && <span className="font-mono text-primary"> · {path}</span>}</h2>
              {path && (
                <button type="button" onClick={() => filterPath("")} className="text-sm text-gray-400 hover:text-white">
                  Show all pages
                </button>
              )}
            </div>
            {data.recent.length === 0 ? (
              <p className="text-gray-400 text-sm">No visits yet.</p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-[#1a1a1a]">
                        <th className="py-2 pr-3 font-medium">Time</th>
                        <th className="py-2 px-3 font-medium">Page</th>
                        <th className="py-2 px-3 font-medium">Visitor</th>
                        <th className="py-2 px-3 font-medium">Device</th>
                        <th className="py-2 pl-3 font-medium">From</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.recent.map((v) => (
                        <tr key={v._id} className="border-b border-[#1a1a1a] last:border-0">
                          <td className="py-2 pr-3 whitespace-nowrap text-gray-300">{dateTime(v.at)}</td>
                          <td className="py-2 px-3 font-mono">{v.path}</td>
                          <td className="py-2 px-3">{v.email || <span className="text-gray-500">Guest</span>}</td>
                          <td className="py-2 px-3 capitalize text-gray-400">{v.device || "—"}</td>
                          <td className="py-2 pl-3 text-gray-400">{v.referrer || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pager page={data.page} pages={data.pages} onPage={setPage} />
              </>
            )}
          </Card>

          <p className="text-xs text-gray-500">
            Admin pages aren't counted. IP addresses aren't stored, and password reset links are masked. Logs are kept for 90 days.
          </p>
        </>
      )}
    </div>
  );
};

/* ----------------------------------- Emails ----------------------------------- */

const Emails = () => {
  const api = useAdminApi();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ q: "", status: "", type: "", page: 1 });
  const [data, setData] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const reload = () => setReloadKey((k) => k + 1);

  const removeEntry = async (entry) => {
    if (!window.confirm(`Delete the log entry for the email to ${entry.to}?`)) return;
    try {
      await api.del(`/emails/${entry._id}`);
      reload();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the log entry"));
    }
  };

  useEffect(() => {
    api.get("/emails", {
      q: filters.q || undefined,
      status: filters.status || undefined,
      type: filters.type || undefined,
      page: filters.page,
    })
      .then(setData)
      .catch(() => toast.error("Couldn't load email log"));
  }, [api, filters, reloadKey]);

  const updateSearch = useMemo(() => debounce((q) => setFilters((f) => ({ ...f, q, page: 1 })), 350), []);
  const counts = data?.last30Days || {};
  const sent30 = Object.values(counts).reduce((a, b) => a + b, 0);
  const problems30 = ["failed", "bounced", "blocked", "spam", "invalid"].reduce((sum, key) => sum + (counts[key] || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Emails (30 days)" value={sent30} />
        <Stat label="Delivered or opened" value={(counts.delivered || 0) + (counts.opened || 0) + (counts.clicked || 0)} sub={data?.webhookEnabled ? undefined : "Needs the Brevo webhook"} />
        <Stat label="Problems" value={problems30} sub="Failed, bounced, blocked or spam" />
        <Stat label="Opened" value={(counts.opened || 0) + (counts.clicked || 0)} sub={data?.webhookEnabled ? undefined : "Needs the Brevo webhook"} />
      </div>

      {data && !data.webhookEnabled && (
        <p className="text-sm text-yellow-100 rounded-xl border border-yellow-400/30 bg-yellow-400/10 px-4 py-3">
          Emails show as "sent" when Brevo accepts them. To see delivered, bounced and opened, set <code>BREVO_WEBHOOK_SECRET</code> and add the
          webhook in Brevo (see the README).
        </p>
      )}

      <Card>
        <div className="flex justify-end mb-3">
          <ClearLogs kind="emails" label="email logs" onCleared={reload} />
        </div>
        <div className="flex flex-col lg:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" aria-hidden="true" />
            <label htmlFor="admin-email-search" className="sr-only">Search by recipient</label>
            <input
              id="admin-email-search"
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                updateSearch(e.target.value.trim());
              }}
              placeholder="Search by recipient email"
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <label htmlFor="admin-email-type" className="sr-only">Filter by type</label>
            <select id="admin-email-type" value={filters.type} onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))} className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white">
              <option value="">All types</option>
              {Object.entries(EMAIL_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <label htmlFor="admin-email-status" className="sr-only">Filter by status</label>
            <select id="admin-email-status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value, page: 1 }))} className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white">
              <option value="">All statuses</option>
              <option value="problems">Problems only</option>
              {Object.keys(EMAIL_STATUS_STYLE).map((status) => <option key={status} value={status} className="capitalize">{status}</option>)}
            </select>
          </div>
        </div>

        {!data ? (
          <div className="h-40 rounded-xl bg-white/5 animate-pulse" aria-busy="true" />
        ) : data.emails.length === 0 ? (
          <p className="text-gray-400 py-6 text-center">No emails match.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 border-b border-[#1a1a1a]">
                    <th className="py-2 pr-3 font-medium">Sent</th>
                    <th className="py-2 px-3 font-medium">Recipient</th>
                    <th className="py-2 px-3 font-medium">Type</th>
                    <th className="py-2 px-3 font-medium">Status</th>
                    <th className="py-2 px-3 font-medium">Details</th>
                    <th className="py-2 pl-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {data.emails.map((e) => (
                    <tr key={e._id} className="border-b border-[#1a1a1a] last:border-0 align-top">
                      <td className="py-2.5 pr-3 whitespace-nowrap text-gray-300">{dateTime(e.createdAt)}</td>
                      <td className="py-2.5 px-3">{e.to}</td>
                      <td className="py-2.5 px-3">
                        <span className="block">{EMAIL_TYPE_LABELS[e.type] || "Other"}</span>
                        <span className="block text-xs text-gray-500 truncate max-w-[220px]">{e.subject}</span>
                      </td>
                      <td className="py-2.5 px-3"><EmailStatus status={e.status} /></td>
                      <td className="py-2.5 px-3 text-xs text-gray-400 max-w-[260px]">
                        {e.error || (e.events?.length ? `${e.events.length} delivery events, last ${dateTime(e.events[e.events.length - 1].at)}` : "—")}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <button type="button" onClick={() => removeEntry(e)} aria-label={`Delete log entry for ${e.to}`} className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={data.page} pages={data.pages} onPage={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </Card>
    </div>
  );
};

/* ---------------------------------- AI usage ---------------------------------- */

const AiUsage = () => {
  const api = useAdminApi();
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setData(null);
    api.get("/ai-usage", { days }).then(setData).catch((err) => setError(errorMessage(err, "Couldn't load AI usage")));
  }, [api, days, reloadKey]);

  if (error) return <p className="text-red-300">{error}</p>;

  const chartOptions = data && {
    chart: { type: "bar", background: "transparent", toolbar: { show: false }, stacked: true },
    colors: ["#3affa3", "#f87171"],
    xaxis: { categories: data.byDay.map((d) => d.date.slice(5)), labels: { style: { colors: "#9ca3af" } } },
    yaxis: { labels: { style: { colors: "#9ca3af" }, formatter: (v) => Math.round(v) } },
    grid: { borderColor: "#1f1f1f" },
    dataLabels: { enabled: false },
    legend: { labels: { colors: "#d1d5db" } },
    plotOptions: { bar: { borderRadius: 3, columnWidth: "60%" } },
    tooltip: { theme: "dark" },
    theme: { mode: "dark" },
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-end gap-3">
        <ClearLogs kind="ai-usage" label="AI usage logs" onCleared={() => setReloadKey((k) => k + 1)} />
        <div className="flex gap-1 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1" role="group" aria-label="Time range">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={`px-3 py-1.5 rounded-lg text-sm ${days === d ? "bg-primary text-black font-medium" : "text-gray-300 hover:bg-white/5"}`}
            >
              {d} days
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <div className="h-64 rounded-2xl bg-[#0a0a0a] animate-pulse" aria-busy="true" />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Requests" value={compact(data.totals.requests)} sub={`${data.totals.activeUsers} users · ${data.byMode.chat || 0} chat · ${data.byMode.analysis || 0} chart`} />
            <Stat label="Estimated cost" value={usd(data.totals.estimatedCostUsd)} sub={`Gemini at $${data.pricing.inputUsdPerMillion}/$${data.pricing.outputUsdPerMillion} per 1M tokens`} />
            <Stat label="Tokens" value={compact(data.totals.promptTokens + data.totals.outputTokens)} sub={`${compact(data.totals.promptTokens)} in · ${compact(data.totals.outputTokens)} out`} />
            <Stat
              label="Errors"
              value={data.totals.errors}
              sub={`${(data.totals.errorRate * 100).toFixed(1)}% of requests · avg ${(data.totals.avgDurationMs / 1000).toFixed(1)}s per answer`}
            />
          </div>

          <Card>
            <h2 className="text-lg font-semibold mb-4">Requests per day</h2>
            {data.byDay.length === 0 ? (
              <p className="text-gray-400 text-sm">No AI requests in this period.</p>
            ) : (
              <ReactApexChart
                options={chartOptions}
                series={[
                  { name: "Successful", data: data.byDay.map((d) => d.requests - d.errors) },
                  { name: "Failed", data: data.byDay.map((d) => d.errors) },
                ]}
                type="bar"
                height={260}
              />
            )}
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h2 className="text-lg font-semibold mb-3">Top users</h2>
              {data.topUsers.length === 0 ? (
                <p className="text-gray-400 text-sm">No usage yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-[#1a1a1a]">
                      <th className="py-2 pr-3 font-medium">User</th>
                      <th className="py-2 px-3 font-medium text-right">Requests</th>
                      <th className="py-2 px-3 font-medium text-right">Tokens</th>
                      <th className="py-2 pl-3 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topUsers.map((u) => (
                      <tr key={u.userId || u.email} className="border-b border-[#1a1a1a] last:border-0">
                        <td className="py-2 pr-3 truncate max-w-[180px]">{u.email}</td>
                        <td className="py-2 px-3 text-right">{u.requests}</td>
                        <td className="py-2 px-3 text-right">{compact(u.tokens)}</td>
                        <td className="py-2 pl-3 text-right">{usd(u.estimatedCostUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            <Card>
              <h2 className="text-lg font-semibold mb-3">Data lookups by the AI</h2>
              {data.tools.length === 0 ? (
                <p className="text-gray-400 text-sm">The AI hasn't looked up any data yet.</p>
              ) : (
                <ul className="divide-y divide-[#1a1a1a] text-sm">
                  {data.tools.map((t) => (
                    <li key={t.name} className="flex justify-between py-2">
                      <span className="font-mono text-gray-300">{t.name}</span>
                      <span>{t.calls}</span>
                    </li>
                  ))}
                </ul>
              )}

              <h2 className="text-lg font-semibold mt-6 mb-3">Recent errors</h2>
              {data.recentErrors.length === 0 ? (
                <p className="text-gray-400 text-sm">No errors.</p>
              ) : (
                <ul className="divide-y divide-[#1a1a1a] text-sm">
                  {data.recentErrors.map((e) => (
                    <li key={e._id} className="py-2">
                      <p className="text-red-300 break-words">{e.error}</p>
                      <p className="text-xs text-gray-500">{e.email} · {e.mode} · {dateTime(e.at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <p className="text-xs text-gray-500">
            Costs are estimates from token counts. Check Google AI Studio billing for exact charges.
          </p>
        </>
      )}
    </div>
  );
};

/* -------------------------------- Activity log -------------------------------- */

const ACTION_LABELS = {
  create_user: "created",
  update_user: "updated",
  block_user: "blocked",
  unblock_user: "unblocked",
  delete_user: "deleted",
  send_password_reset: "sent a password reset to",
  delete_alert: "deleted an alert for",
  delete_email_log: "deleted an email log entry for",
};

const describeChange = (entry) => {
  const details = entry.details || {};
  if (entry.action === "clear_logs") {
    return `${details.deleted} entries removed`;
  }
  if (entry.action === "delete_alert" && details.alert) {
    return `${details.alert.symbol} ${details.alert.condition} ${details.alert.targetPrice}`;
  }
  if (entry.action === "delete_user" && details.removed) {
    return `removed ${details.removed.trades} trades and ${details.removed.alerts} alerts`;
  }
  const after = details.after || {};
  const before = details.before || {};
  return Object.keys(after)
    .map((field) => {
      if (field === "aiPromptCount") return "reset AI prompts";
      if (["promptCountResetAt", "isBlocked"].includes(field)) return null;
      const format = (v) => (field === "subscriptionExpiry" ? date(v) : v ?? "none");
      return entry.action === "create_user" ? `${field}: ${format(after[field])}` : `${field}: ${format(before[field])} → ${format(after[field])}`;
    })
    .filter(Boolean)
    .join(", ");
};

const Activity = () => {
  const api = useAdminApi();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/audit-log", { page }).then(setData).catch(() => toast.error("Couldn't load activity log"));
  }, [api, page]);

  return (
    <Card>
      {!data ? (
        <div className="h-40 rounded-xl bg-white/5 animate-pulse" aria-busy="true" />
      ) : data.entries.length === 0 ? (
        <p className="text-gray-400 py-6 text-center">No admin changes yet.</p>
      ) : (
        <>
          <ul className="divide-y divide-[#1a1a1a] text-sm">
            {data.entries.map((entry) => {
              const detail = describeChange(entry);
              return (
                <li key={entry._id} className="py-3">
                  <p className="text-white">
                    <span className="font-medium">{entry.adminEmail}</span>{" "}
                    {entry.action === "clear_logs" ? (
                      <>cleared {entry.details?.scope} {entry.details?.log}</>
                    ) : (
                      <>
                        {ACTION_LABELS[entry.action] || entry.action}{" "}
                        <span className="font-medium">{entry.targetEmail || "a user"}</span>
                      </>
                    )}
                  </p>
                  <p className="text-gray-400 text-xs mt-0.5">{detail ? `${detail} · ` : ""}{dateTime(entry.createdAt)}</p>
                </li>
              );
            })}
          </ul>
          <Pager page={data.page} pages={data.pages} onPage={setPage} />
        </>
      )}
    </Card>
  );
};

/* ------------------------------------ Page ------------------------------------ */

const PIN_STORAGE_KEY = "zelbi:admin-sidebar-pinned";

const readPinned = () => {
  try {
    return localStorage.getItem(PIN_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
};

const AdminHeader = ({ onOpenMenu }) => {
  const { user } = useSelector((state) => state.profile);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 inset-x-0 z-[110] h-16 bg-black border-b border-white/10">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMenu}
            aria-label="Open admin menu"
            className="md:hidden p-2 -ml-2 rounded-lg text-gray-300 hover:bg-white/5"
          >
            <HiMenu className="text-xl" />
          </button>
          <Link to="/admin" aria-label="Admin home">
            <img src={logo} alt="Zelbi" className="h-7 w-auto" />
          </Link>
          <span className="px-2 py-0.5 rounded-md bg-yellow-400/15 text-yellow-300 text-xs font-semibold uppercase tracking-wide">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-sm">
          <span className="hidden md:block text-gray-400 truncate max-w-[220px]">{user?.email}</span>
          <Link to="/dashboard" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/5">
            <FaArrowLeft aria-hidden="true" /> <span className="hidden sm:inline">Back to site</span>
          </Link>
          <button
            type="button"
            onClick={() => dispatch(logout(navigate))}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-gray-300 hover:text-red-300 hover:bg-white/5"
          >
            <FaSignOutAlt aria-hidden="true" /> <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// Dashboards of outside services, opened in a new tab
const EXTERNAL_TOOLS = [
  {
    label: "Google Analytics",
    href: "https://analytics.google.com/analytics/web/#/a400739171p559734044/realtime/overview",
    icon: SiGoogleanalytics,
  },
  {
    label: "Tag Manager",
    href: "https://tagmanager.google.com/#/container/accounts/6383673500/containers/267753129/workspaces/2",
    icon: SiGoogletagmanager,
  },
];

const ExternalTools = ({ expanded }) => (
  <div className="px-2 pb-2">
    <p className={`px-3 pt-2 pb-1 text-[11px] uppercase tracking-wide text-gray-500 ${expanded ? "" : "sr-only"}`}>Tools</p>
    {EXTERNAL_TOOLS.map(({ label, href, icon: Icon }) => (
      <a
        key={label}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={expanded ? undefined : `${label} (opens in a new tab)`}
        className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white"
      >
        <Icon className="shrink-0 text-base" aria-hidden="true" />
        <span className={`flex-1 whitespace-nowrap ${expanded ? "" : "sr-only"}`}>{label}</span>
        {expanded && <FiExternalLink className="shrink-0 text-xs text-gray-500" aria-label="opens in a new tab" />}
      </a>
    ))}
  </div>
);

const SidebarNav = ({ tab, onSelect, expanded }) => (
  <nav aria-label="Admin sections" className="flex-1 p-2 space-y-1">
    {TABS.map(({ id, label, icon: Icon }) => {
      const active = tab === id;
      return (
        <button
          key={id}
          type="button"
          onClick={() => onSelect(id)}
          aria-current={active ? "page" : undefined}
          title={expanded ? undefined : label}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
            active ? "bg-primary text-black font-medium" : "text-gray-300 hover:bg-white/5 hover:text-white"
          }`}
        >
          <Icon className="shrink-0 text-base" aria-hidden="true" />
          <span className={`whitespace-nowrap transition-opacity duration-150 ${expanded ? "opacity-100" : "opacity-0 sr-only"}`}>
            {label}
          </span>
        </button>
      );
    })}
  </nav>
);

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === searchParams.get("tab")) ? searchParams.get("tab") : "overview";
  const [pinned, setPinned] = useState(readPinned);
  const [hovered, setHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.title = "Zelbi | Admin";
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(PIN_STORAGE_KEY, String(pinned));
    } catch {
      // Storage can be unavailable (private mode); the sidebar still works for this visit
    }
  }, [pinned]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  const selectTab = (id) => {
    setSearchParams({ tab: id });
    setMobileOpen(false);
  };

  // Unpinned, the sidebar shows icons only and widens over the content on hover or keyboard focus
  const expanded = pinned || hovered;

  return (
    <div className="min-h-screen bg-black text-white">
      <AdminHeader onOpenMenu={() => setMobileOpen(true)} />

      {/* Desktop sidebar */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHovered(false)}
        className={`hidden md:flex flex-col fixed top-16 bottom-0 left-0 z-[100] bg-[#050505] border-r border-white/10 transition-[width] duration-200 ${
          expanded ? "w-60" : "w-16"
        } ${!pinned && hovered ? "shadow-2xl shadow-black" : ""}`}
      >
        <SidebarNav tab={tab} onSelect={selectTab} expanded={expanded} />
        <ExternalTools expanded={expanded} />
        <div className="p-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setPinned((p) => !p)}
            aria-pressed={pinned}
            title={pinned ? "Unpin sidebar" : "Pin sidebar"}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-400 hover:bg-white/5 hover:text-white"
          >
            {pinned ? <BsPinAngleFill className="shrink-0 text-base text-primary" aria-hidden="true" /> : <BsPinAngle className="shrink-0 text-base" aria-hidden="true" />}
            <span className={`whitespace-nowrap ${expanded ? "" : "sr-only"}`}>{pinned ? "Unpin sidebar" : "Pin sidebar"}</span>
          </button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-[120]" role="dialog" aria-modal="true" aria-label="Admin menu">
          <button type="button" aria-label="Close admin menu" className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-64 max-w-[80vw] bg-[#050505] border-r border-white/10 flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
              <span className="font-semibold">Admin</span>
              <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close admin menu" className="p-2 rounded-lg text-gray-300 hover:bg-white/5">
                <HiX className="text-xl" />
              </button>
            </div>
            <SidebarNav tab={tab} onSelect={selectTab} expanded />
            <ExternalTools expanded />
          </aside>
        </div>
      )}

      <main className={`pt-16 transition-[margin] duration-200 ${pinned ? "md:ml-60" : "md:ml-16"}`}>
        <div className="max-w-6xl mx-auto px-4 pt-8 pb-16">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">{TABS.find((t) => t.id === tab).label}</h1>

          {tab === "overview" && <Overview />}
          {tab === "pages" && <PageViews />}
          {tab === "users" && <Users />}
          {tab === "payments" && <Payments />}
          {tab === "emails" && <Emails />}
          {tab === "ai" && <AiUsage />}
          {tab === "activity" && <Activity />}
        </div>
      </main>
    </div>
  );
};

export default Admin;
