import axios from "axios";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { toast } from "react-hot-toast";
import { FaChartBar, FaCreditCard, FaDownload, FaHistory, FaSearch, FaTrash, FaUserPlus, FaUsers } from "react-icons/fa";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";

const ADMIN_URL = `${process.env.REACT_APP_API_URL}/api/admin`;

const TABS = [
  { id: "overview", label: "Overview", icon: FaChartBar },
  { id: "users", label: "Users", icon: FaUsers },
  { id: "payments", label: "Payments", icon: FaCreditCard },
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

/* -------------------------------- Activity log -------------------------------- */

const ACTION_LABELS = {
  create_user: "created",
  update_user: "updated",
  block_user: "blocked",
  unblock_user: "unblocked",
  delete_user: "deleted",
  send_password_reset: "sent a password reset to",
  delete_alert: "deleted an alert for",
};

const describeChange = (entry) => {
  const details = entry.details || {};
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
                    <span className="font-medium">{entry.adminEmail}</span> {ACTION_LABELS[entry.action] || entry.action}{" "}
                    <span className="font-medium">{entry.targetEmail || "a user"}</span>
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

const Admin = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = TABS.some((t) => t.id === searchParams.get("tab")) ? searchParams.get("tab") : "overview";

  useEffect(() => {
    document.title = "Zelbi | Admin";
  }, []);

  return (
    <div className="min-h-screen bg-black text-white pt-20 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6">Admin</h1>

        <div className="flex gap-1 overflow-x-auto scrollbar-hide mb-6 bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-1 w-fit max-w-full" role="tablist">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setSearchParams({ tab: id })}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap ${tab === id ? "bg-primary text-black font-medium" : "text-gray-300 hover:bg-white/5"}`}
            >
              <Icon aria-hidden="true" /> {label}
            </button>
          ))}
        </div>

        {tab === "overview" && <Overview />}
        {tab === "users" && <Users />}
        {tab === "payments" && <Payments />}
        {tab === "activity" && <Activity />}
      </div>
    </div>
  );
};

export default Admin;
