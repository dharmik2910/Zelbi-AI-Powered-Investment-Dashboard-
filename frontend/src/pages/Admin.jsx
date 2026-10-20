import axios from "axios";
import debounce from "lodash/debounce";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { toast } from "react-hot-toast";
import { FaChartBar, FaCreditCard, FaHistory, FaSearch, FaUsers } from "react-icons/fa";
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

const isPlanActive = (u) => u.subscriptionPlan !== "free" && u.subscriptionExpiry && new Date(u.subscriptionExpiry) > new Date();

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
      patch: (path, body) => axios.patch(`${ADMIN_URL}${path}`, body, config).then((r) => r.data),
    };
  }, [token]);
};

const Overview = () => {
  const api = useAdminApi();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/stats").then((d) => setStats(d.stats)).catch((err) => setError(err.response?.data?.message || "Couldn't load stats"));
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

const UserDetail = ({ userId, onClose, onSaved }) => {
  const api = useAdminApi();
  const { user: me } = useSelector((state) => state.profile);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    api.get(`/users/${userId}`).then((d) => {
      setData(d);
      setForm({
        subscriptionPlan: d.user.subscriptionPlan || "free",
        subscriptionExpiry: d.user.subscriptionExpiry ? d.user.subscriptionExpiry.slice(0, 10) : "",
        role: d.user.role || "user",
      });
    }).catch(() => toast.error("Couldn't load user"));
  }, [api, userId]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (extra = {}) => {
    const u = data.user;
    const body = { ...extra };
    if (form.subscriptionPlan !== (u.subscriptionPlan || "free")) body.subscriptionPlan = form.subscriptionPlan;
    if (form.subscriptionPlan !== "free" && form.subscriptionExpiry && form.subscriptionExpiry !== (u.subscriptionExpiry || "").slice(0, 10)) {
      body.subscriptionExpiry = form.subscriptionExpiry;
    }
    if (form.role !== (u.role || "user")) body.role = form.role;
    if (Object.keys(body).length === 0) {
      toast("No changes to save");
      return;
    }
    if (body.role && !window.confirm(`Change ${u.email}'s role to ${body.role}?`)) return;

    setSaving(true);
    try {
      await api.patch(`/users/${userId}`, body);
      toast.success("User updated");
      load();
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't update user");
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-primary";
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4" onClick={onClose} role="presentation">
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="dialog"
        aria-modal="true"
        aria-label="User details"
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl p-6"
      >
        {!data || !form ? (
          <p className="text-gray-400">Loading…</p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-xl font-semibold truncate">{fullName(data.user)}</h2>
                <p className="text-gray-400 text-sm truncate">{data.user.email}</p>
                <p className="text-gray-500 text-xs mt-1">
                  Joined {date(data.user.createdAt)} · {data.user.googleId ? "Google sign-in" : "Email sign-in"}
                </p>
              </div>
              <PlanBadge user={data.user} />
            </div>

            <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              {[
                ["AI prompts used", data.user.aiPromptCount || 0],
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
              <h3 className="font-semibold mb-3">Subscription and access</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="admin-plan" className="block text-sm text-gray-300 mb-1">Plan</label>
                  <select id="admin-plan" value={form.subscriptionPlan} onChange={(e) => setForm({ ...form, subscriptionPlan: e.target.value })} className={inputClass}>
                    <option value="free">Free</option>
                    <option value="pro">Pro</option>
                    <option value="elite">Elite</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="admin-expiry" className="block text-sm text-gray-300 mb-1">Active until</label>
                  <input
                    id="admin-expiry"
                    type="date"
                    min={tomorrow}
                    disabled={form.subscriptionPlan === "free"}
                    value={form.subscriptionPlan === "free" ? "" : form.subscriptionExpiry}
                    onChange={(e) => setForm({ ...form, subscriptionExpiry: e.target.value })}
                    className={`${inputClass} [color-scheme:dark] disabled:opacity-40`}
                  />
                </div>
                <div>
                  <label htmlFor="admin-role" className="block text-sm text-gray-300 mb-1">Role</label>
                  <select
                    id="admin-role"
                    value={form.role}
                    disabled={String(data.user._id) === String(me?._id)}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className={`${inputClass} disabled:opacity-40`}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Changing a plan here doesn't charge or refund the user. Paid plans without a date get 30 days.
              </p>
              <div className="flex flex-wrap justify-end gap-3 mt-4">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => window.confirm("Reset this user's AI prompt count to 0?") && save({ resetPrompts: true })}
                  className="px-4 py-2 rounded-lg bg-[#141414] border border-[#2a2a2a] hover:border-primary/50 disabled:opacity-40"
                >
                  Reset AI prompts
                </button>
                <button type="button" disabled={saving} onClick={() => save()} className="px-5 py-2 rounded-lg bg-primary text-black font-medium hover:bg-primary-hover disabled:opacity-40">
                  {saving ? "Saving…" : "Save changes"}
                </button>
              </div>
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

            <div className="flex justify-end pt-6">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-white/5">Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const Users = () => {
  const api = useAdminApi();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState({ q: "", plan: "", page: 1 });
  const [data, setData] = useState(null);
  const [selected, setSelected] = useState(null);

  const load = useCallback(() => {
    api.get("/users", { q: filters.q || undefined, plan: filters.plan || undefined, page: filters.page })
      .then(setData)
      .catch(() => toast.error("Couldn't load users"));
  }, [api, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const updateSearch = useMemo(() => debounce((q) => setFilters((f) => ({ ...f, q, page: 1 })), 350), []);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
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
            className="w-full bg-[#141414] border border-[#2a2a2a] rounded-lg pl-9 pr-3 py-2 text-white focus:outline-none focus:border-primary"
          />
        </div>
        <label htmlFor="admin-plan-filter" className="sr-only">Filter by plan</label>
        <select
          id="admin-plan-filter"
          value={filters.plan}
          onChange={(e) => setFilters((f) => ({ ...f, plan: e.target.value, page: 1 }))}
          className="bg-[#141414] border border-[#2a2a2a] rounded-lg px-3 py-2 text-white"
        >
          <option value="">All plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="elite">Elite</option>
        </select>
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

      {selected && <UserDetail userId={selected} onClose={() => setSelected(null)} onSaved={load} />}
    </Card>
  );
};

const Payments = () => {
  const api = useAdminApi();
  const [filters, setFilters] = useState({ status: "", page: 1 });
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/payments", { status: filters.status || undefined, page: filters.page })
      .then(setData)
      .catch(() => toast.error("Couldn't load payments"));
  }, [api, filters]);

  return (
    <Card>
      <div className="flex justify-end mb-4">
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

const describeChange = (details) => {
  const after = details?.after || {};
  const before = details?.before || {};
  return Object.keys(after)
    .map((field) => {
      if (field === "aiPromptCount") return "reset AI prompts";
      if (field === "promptCountResetAt") return null;
      const format = (v) => (field === "subscriptionExpiry" ? date(v) : v ?? "none");
      return `${field}: ${format(before[field])} → ${format(after[field])}`;
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
            {data.entries.map((entry) => (
              <li key={entry._id} className="py-3">
                <p className="text-white">
                  <span className="font-medium">{entry.adminEmail}</span> updated{" "}
                  <span className="font-medium">{entry.targetEmail}</span>
                </p>
                <p className="text-gray-400 text-xs mt-0.5">{describeChange(entry.details)} · {dateTime(entry.createdAt)}</p>
              </li>
            ))}
          </ul>
          <Pager page={data.page} pages={data.pages} onPage={setPage} />
        </>
      )}
    </Card>
  );
};

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
