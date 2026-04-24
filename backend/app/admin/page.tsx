"use client";

import { useEffect, useMemo, useState } from "react";

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

function formatOrderLabel(id: string) {
  const shortId = id.slice(-4).toUpperCase();
  return `Order #${shortId}`;
}

function StatCard({
  title,
  value,
  subtitle,
  trend,
  badge,
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
  badge: string;
  accentClass: string;
  backgroundClass: string;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
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
          <span className={`text-sm font-bold ${accentClass}`}>{badge}</span>
        </div>
      </div>
    </article>
  );
}

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/stats", {
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

      console.error("Error loading admin stats:", fetchError);
      setError("Unable to load stats right now.");
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
    return (
      stats.totalOrders > 0 ||
      stats.todayOrders > 0 ||
      stats.pendingOrders > 0 ||
      stats.totalRevenue > 0 ||
      stats.recentOrders.length > 0
    );
  }, [stats]);

  const cards = [
    {
      title: "Total Orders",
      value: stats.totalOrders.toLocaleString("en-IN"),
      subtitle: "All time orders",
      badge: "TO",
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
      badge: "TD",
      accentClass: "text-indigo-600",
      backgroundClass: "bg-indigo-50",
    },
    {
      title: "Pending Orders",
      value: stats.pendingOrders.toLocaleString("en-IN"),
      subtitle: "Awaiting processing",
      badge: "PO",
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
      badge: "INR",
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
          <p className="mt-1 text-sm text-slate-600">Overview of store performance.</p>
        </div>

        {!error ? (
          <button
            type="button"
            onClick={retry}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className={loading ? "inline-block animate-spin" : "inline-block"}>↻</span>
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
        <>
          <section className="grid gap-4 sm:grid-cols-2">
            {cards.map((card) => (
              <StatCard
                key={card.title}
                title={card.title}
                value={card.value}
                subtitle={card.subtitle}
                trend={card.trend}
                badge={card.badge}
                accentClass={card.accentClass}
                backgroundClass={card.backgroundClass}
              />
            ))}
          </section>

          <section className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Recent Orders</h2>
            <p className="mt-1 text-xs text-slate-500">Latest activity from your customers</p>

            <div className="mt-4 space-y-3">
              {stats.recentOrders.length === 0 ? (
                <p className="text-sm text-slate-500">No recent orders available.</p>
              ) : (
                stats.recentOrders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-200 hover:bg-white">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">{formatOrderLabel(order.id)}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{order.userName}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold text-emerald-700">{formatCurrency(order.total)}</span>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-600">
                          {order.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">Placed at {formatOrderTime(order.createdAt)}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
