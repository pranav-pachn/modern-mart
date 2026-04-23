"use client";

import { useEffect, useMemo, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Clock3, IndianRupee, PackageCheck, RefreshCw, ShoppingCart } from "lucide-react";

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
  return new Date(isoDate).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
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

  const hasData = useMemo(() => Object.values(stats).some((value) => value > 0), [stats]);

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

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
            <p className="mt-1 text-xs text-slate-500">Latest activity from your customers</p>

            <div className="mt-4 space-y-3">
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500">No recent orders available.</p>
              ) : (
                stats.recentOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold text-slate-900">{order.userName}</p>
                      <span className="text-xs text-slate-500">{formatOrderTime(order.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-xs capitalize text-slate-600">{order.status}</span>
                      <span className="text-sm font-semibold text-emerald-700">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}
