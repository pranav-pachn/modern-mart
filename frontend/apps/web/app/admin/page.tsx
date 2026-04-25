"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import Link from "next/link";
import { Clock3, IndianRupee, PackageCheck, RefreshCw, ShoppingCart, ChevronRight, PlusCircle } from "lucide-react";

type AdminStats = {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  todayOrdersDelta: number;
  revenueDeltaPercent: number;
  recentOrders: {
    id: string;
    userName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
};

const initialStats: AdminStats = {
  totalOrders: 0,
  todayOrders: 0,
  pendingOrders: 0,
  totalRevenue: 0,
  todayOrdersDelta: 0,
  revenueDeltaPercent: 0,
  recentOrders: [],
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(value);
}

function formatTrend(value: number, suffix = "") {
  const positive = value >= 0;
  const symbol = positive ? "↑" : "↓";
  const abs = Math.abs(value);
  return `${symbol} ${suffix}${abs.toFixed(suffix ? 1 : 0)}${suffix ? "%" : ""}`;
}

function formatOrderTime(isoDate: string) {
  return new Date(isoDate).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getStatusBadgeClass(status: string) {
  const s = (status || "pending").toLowerCase();
  if (s === "delivered") return "bg-emerald-100 text-emerald-700";
  if (s === "out for delivery") return "bg-amber-100 text-amber-700";
  if (s === "accepted") return "bg-blue-100 text-blue-700";
  if (s === "cancelled") return "bg-red-100 text-red-700";
  return "bg-gray-100 text-gray-600";
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  accentClass,
  backgroundClass,
}: {
  title: string;
  value: string;
  subtitle: string;
  trend?: {
    label: string;
    positive: boolean;
  };
  icon: React.ComponentType<{ className?: string }>;
  accentClass: string;
  backgroundClass: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className={`mt-3 text-3xl font-semibold tracking-tight ${accentClass}`}>{value}</p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
          {trend ? (
            <p className={`mt-2 text-xs font-semibold ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
              {trend.label}
            </p>
          ) : null}
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${backgroundClass}`}>
          <Icon className={`h-5 w-5 ${accentClass}`} />
        </div>
      </div>
    </article>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await adminFetch("/api/admin/stats", {
        method: "GET",
        signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as Partial<AdminStats>;

      setStats({
        totalOrders: Number(data.totalOrders ?? 0),
        todayOrders: Number(data.todayOrders ?? 0),
        pendingOrders: Number(data.pendingOrders ?? 0),
        totalRevenue: Number(data.totalRevenue ?? 0),
        todayOrdersDelta: Number(data.todayOrdersDelta ?? 0),
        revenueDeltaPercent: Number(data.revenueDeltaPercent ?? 0),
        recentOrders: Array.isArray(data.recentOrders) ? data.recentOrders : [],
      });
    } catch (fetchError) {
      if ((fetchError as Error).name === "AbortError") {
        return;
      }

      console.error("Failed to load admin stats:", fetchError);
      setError("Unable to load dashboard stats right now.");
      setStats(initialStats);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    void loadStats(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const hasData = useMemo(() => {
  return stats.totalOrders > 0 || stats.todayOrders > 0 || stats.pendingOrders > 0 || stats.totalRevenue > 0 || stats.recentOrders.length > 0;
}, [stats]);

  const cards = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString("en-IN"),
      subtitle: "All time orders",
      icon: ShoppingCart,
      accentClass: "text-blue-600",
      backgroundClass: "bg-blue-50",
    },
    {
      title: "Today Orders",
      value: stats.todayOrders.toLocaleString("en-IN"),
      subtitle: "Orders placed today",
      trend: {
        label: formatTrend(stats.todayOrdersDelta),
        positive: stats.todayOrdersDelta >= 0,
      },
      icon: Clock3,
      accentClass: "text-indigo-600",
      backgroundClass: "bg-indigo-50",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toLocaleString("en-IN"),
      subtitle: "Awaiting processing",
      icon: PackageCheck,
      accentClass: "text-amber-600",
      backgroundClass: "bg-amber-50",
    },
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      subtitle: "Gross lifetime revenue",
      trend: {
        label: formatTrend(stats.revenueDeltaPercent, "+"),
        positive: stats.revenueDeltaPercent >= 0,
      },
      icon: IndianRupee,
      accentClass: "text-emerald-600",
      backgroundClass: "bg-emerald-50",
    },
  ];

  const retry = () => {
    if (loading) return;
    void loadStats();
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">Quick overview of your grocery store performance.</p>
        </div>

        {!error ? (
          <button
            type="button"
            onClick={retry}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-10 text-sm text-slate-600 shadow-sm">
          Loading stats...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-5 text-sm text-red-700 shadow-sm">
          <p className="font-medium">{error}</p>
          <button
            type="button"
            onClick={retry}
            className="mt-4 inline-flex items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      ) : !hasData ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-sm text-slate-600 shadow-sm">
          No data available
        </div>
      ) : (
        <section className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                trend={card.trend}
                icon={card.icon}
                accentClass={card.accentClass}
                backgroundClass={card.backgroundClass}
              />
            ))}
          </div>

          {/* What to do next - Quick Actions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-3">Quick Actions</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/admin/add-product"
                className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Add Product</p>
                  <p className="text-xs text-emerald-600">Add new items to shop</p>
                </div>
              </Link>
              <Link
                href="/admin/orders"
                className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3 transition hover:border-blue-300 hover:bg-blue-100"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">Manage Orders</p>
                  <p className="text-xs text-blue-600">View and update orders</p>
                </div>
              </Link>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
              <Link
                href="/admin/orders"
                className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 flex items-center gap-1"
              >
                View All <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 mb-4">Latest activity from your customers</p>

            <div className="flex-1 space-y-2">
              {stats.recentOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <span className="text-3xl mb-2">📭</span>
                  <p className="text-sm text-slate-500">No orders yet.</p>
                </div>
              ) : (
                stats.recentOrders.map((order) => (
                  <Link
                    key={order.id}
                    href="/admin/orders"
                    className="group flex flex-col gap-1 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-emerald-200 hover:bg-emerald-50/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-800">
                        {order.userName}
                      </p>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-slate-400">{formatOrderTime(order.createdAt)}</span>
                      <span className="text-sm font-bold text-emerald-700">{formatCurrency(order.total)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>

            <Link
              href="/admin/orders"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-emerald-300 hover:text-emerald-700"
            >
              <ShoppingCart className="h-4 w-4" />
              Manage All Orders
            </Link>
          </aside>
        </section>
      )}
    </main>
  );
}
