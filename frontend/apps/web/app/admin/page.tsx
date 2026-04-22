"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import {
  ShoppingCart,
  TrendingUp,
  Clock,
  Package,
  IndianRupee,
  RefreshCw,
  CheckCircle2,
  Truck,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// ── Types ──────────────────────────────────────────────────────────────────
type Stats = {
  totalOrders: number;
  todaysOrders: number;
  totalProducts: number;
  revenue: number;
  pending: number;
};

type AnalyticsData = {
  statusBreakdown: { _id: string; count: number }[];
  revenueByDay: { date: string; revenue: number; orders: number }[];
  ordersByDay: { date: string; count: number }[];
  topProducts: { name: string; revenue: number; units: number; orderCount: number }[];
  recentActivity: { _id: string; userName: string; status: string; total: number; createdAt: string; updatedAt?: string }[];
};

// ── Constants ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#3b82f6",
  "out for delivery": "#8b5cf6",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  pending:            <Clock className="h-4 w-4" />,
  accepted:           <CheckCircle2 className="h-4 w-4" />,
  "out for delivery": <Truck className="h-4 w-4" />,
  delivered:          <CheckCircle2 className="h-4 w-4" />,
  cancelled:          <AlertCircle className="h-4 w-4" />,
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

function capitalize(s: string) {
  if (!s) return "Unknown";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function timeAgo(dateStr: string) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.round(diffMs / 60000);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-zinc-100 bg-white px-4 py-3 shadow-xl text-sm">
      <p className="font-bold text-zinc-700 mb-1">{formatDate(label)}</p>
      <p className="text-emerald-600 font-semibold">₹{payload[0]?.value?.toLocaleString()}</p>
      <p className="text-zinc-400">{payload[1]?.value} orders</p>
    </div>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-zinc-100 ${className}`} />;
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0, todaysOrders: 0, totalProducts: 0, revenue: 0, pending: 0,
  });
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      const [statsRes, productsRes] = await Promise.all([
        adminFetch("/api/orders?stats=1"),
        adminFetch("/api/products?page=1&limit=1"),
      ]);
      if (!statsRes.ok || !productsRes.ok) throw new Error("fetch failed");

      const statsData = await statsRes.json();
      const productsData = await productsRes.json();
      const productsCount = typeof productsData.total === "number"
        ? productsData.total
        : (productsData.products?.length ?? 0);

      setStats({
        totalOrders:  statsData.totalOrders  ?? 0,
        todaysOrders: statsData.todayOrders  ?? 0,
        totalProducts: productsCount,
        revenue:       statsData.revenue     ?? 0,
        pending:       statsData.pendingOrders ?? 0,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setAnalyticsLoading(true);
    try {
      const res = await adminFetch("/api/orders/analytics");
      if (!res.ok) throw new Error();
      setAnalytics(await res.json());
    } catch {
      // Analytics is optional — don't block the whole page
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const refresh = () => {
    setLoading(true);
    setAnalyticsLoading(true);
    setError(false);
    setLastRefreshed(new Date());
    fetchStats();
    fetchAnalytics();
  };

  useEffect(() => {
    fetchStats();
    fetchAnalytics();
  }, []);

  // ── Stat Cards ────────────────────────────────────────────────────────────
  const cards = [
    {
      title: "Total Orders",
      value: stats.totalOrders,
      icon: ShoppingCart,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      title: "Today's Orders",
      value: stats.todaysOrders,
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-100",
    },
    {
      title: "Pending Orders",
      value: stats.pending,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.revenue.toLocaleString("en-IN")}`,
      icon: IndianRupee,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
    {
      title: "Products",
      value: stats.totalProducts,
      icon: Package,
      color: "text-violet-600",
      bg: "bg-violet-50",
      border: "border-violet-100",
    },
  ];

  // ── Pie data ──────────────────────────────────────────────────────────────
  const pieData = analytics?.statusBreakdown.map((s) => ({
    name: capitalize(s._id),
    value: s.count,
    color: STATUS_COLORS[s._id] ?? "#94a3b8",
  })) ?? [];

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Last refreshed: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
        <button
          onClick={refresh}
          disabled={loading || analyticsLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${(loading || analyticsLoading) ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
          <span className="text-lg">⚠️</span>
          Could not load dashboard data. Check your backend connection and try refreshing.
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className={`shadow-none border ${c.border} transition-shadow hover:shadow-md`}>
              <CardHeader className="pb-2">
                <div className={`w-9 h-9 rounded-xl ${loading ? "bg-zinc-100" : c.bg} flex items-center justify-center mb-2`}>
                  {loading
                    ? <div className="w-4 h-4 rounded bg-zinc-200 animate-pulse" />
                    : <Icon className={`w-4 h-4 ${c.color}`} />
                  }
                </div>
                <CardTitle className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider leading-tight">
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading
                  ? <Skeleton className="h-8 w-20" />
                  : <p className={`text-2xl font-black ${c.color}`}>{c.value}</p>
                }
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Charts Row 1: Revenue Area + Orders Bar ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Revenue over 30 days */}
        <Card className="shadow-none border border-zinc-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-zinc-900">Revenue — Last 30 Days</CardTitle>
            <p className="text-xs text-zinc-400">Daily revenue (₹) with order volume overlay</p>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : !analytics?.revenueByDay?.length ? (
              <div className="flex h-52 items-center justify-center text-zinc-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <AreaChart data={analytics.revenueByDay} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="rev"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area
                    yAxisId="rev"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#revenueGrad)"
                    name="Revenue"
                    dot={false}
                    activeDot={{ r: 5, fill: "#10b981" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Orders per day (14d bar chart) */}
        <Card className="shadow-none border border-zinc-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-zinc-900">Orders — Last 14 Days</CardTitle>
            <p className="text-xs text-zinc-400">Number of orders placed per day</p>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : !analytics?.ordersByDay?.length ? (
              <div className="flex h-52 items-center justify-center text-zinc-400 text-sm">No data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={analytics.ordersByDay} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(v: any) => [v, "Orders"]}
                    labelFormatter={formatDate}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      fontSize: "13px",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Bar dataKey="count" name="Orders" fill="#6366f1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Charts Row 2: Status Pie + Top Products ── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Status Breakdown Pie */}
        <Card className="shadow-none border border-zinc-100">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-zinc-900">Order Status Breakdown</CardTitle>
            <p className="text-xs text-zinc-400">Distribution of all order statuses</p>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex h-52 items-center justify-center text-zinc-400 text-sm">No orders yet</div>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any, name: any) => [v, name]}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "1px solid #f1f5f9",
                        fontSize: "13px",
                        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="flex flex-1 flex-col gap-2.5">
                  {pieData.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: entry.color + "22", color: entry.color }}
                        >
                          {STATUS_ICONS[entry.name.toLowerCase()] ?? <CheckCircle2 className="h-3.5 w-3.5" />}
                        </span>
                        <span className="text-sm font-medium text-zinc-700">{entry.name}</span>
                      </div>
                      <span className="text-sm font-bold tabular-nums" style={{ color: entry.color }}>
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card className="shadow-none border border-zinc-100 lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-zinc-900">Top Selling Items</CardTitle>
            <p className="text-xs text-zinc-400">Most frequently ordered products</p>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : !analytics?.topProducts?.length ? (
              <div className="flex h-52 items-center justify-center text-zinc-400 text-sm">No sales data yet</div>
            ) : (
              <div className="space-y-4">
                {analytics.topProducts.map((p, idx) => {
                  const maxOrders = analytics.topProducts[0].orderCount;
                  const pct = maxOrders > 0 ? (p.orderCount / maxOrders) * 100 : 0;
                  return (
                    <div key={p.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">
                            {idx + 1}
                          </span>
                          <p className="text-sm font-semibold text-zinc-800 truncate">{p.name}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="text-sm font-black text-emerald-600">{p.orderCount} orders</p>
                          <p className="text-[10px] text-zinc-400">{p.units} units sold</p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1.5 w-full rounded-full bg-zinc-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Feed */}
        <Card className="shadow-none border border-zinc-100 lg:col-span-1">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-zinc-900">Recent Activity</CardTitle>
            <p className="text-xs text-zinc-400">Latest order updates</p>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : !analytics?.recentActivity?.length ? (
              <div className="flex h-52 items-center justify-center text-zinc-400 text-sm">No activity yet</div>
            ) : (
              <div className="space-y-5">
                {analytics.recentActivity.map((activity) => {
                  const status = activity.status?.toLowerCase() || "pending";
                  const isDelivered = status === "delivered";
                  const isPlaced = status === "pending" || status === "placed";
                  
                  // Action text
                  let actionText = "updated order";
                  if (isPlaced) actionText = "placed a new order";
                  else if (isDelivered) actionText = "order was delivered";
                  else if (status === "accepted") actionText = "order was accepted";
                  else if (status === "out for delivery") actionText = "order is out for delivery";
                  
                  return (
                    <div key={activity._id} className="flex gap-3">
                      <div className="relative mt-1">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-full ring-4 ring-white"
                          style={{ backgroundColor: (STATUS_COLORS[status] || "#94a3b8") + "20", color: STATUS_COLORS[status] || "#94a3b8" }}
                        >
                          {STATUS_ICONS[status] || <ShoppingCart className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-800">
                          <span className="font-semibold text-zinc-900">{activity.userName}</span>{" "}
                          <span className="text-zinc-600">{actionText}</span>
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                          <span className="font-medium">₹{activity.total}</span>
                          <span>•</span>
                          <span>{timeAgo(activity.updatedAt || activity.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
