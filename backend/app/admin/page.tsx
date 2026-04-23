"use client";

import { useEffect, useMemo, useState } from "react";

type AdminStats = {
  totalOrders: number;
  todayOrders: number;
  pendingOrders: number;
  totalRevenue: number;
};

const initialStats: AdminStats = {
  totalOrders: 0,
  todayOrders: 0,
  pendingOrders: 0,
  totalRevenue: 0,
};

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/admin/stats", {
          method: "GET",
          signal: controller.signal,
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

    loadStats();

    return () => {
      controller.abort();
    };
  }, []);

  const hasData = useMemo(() => {
    return Object.values(stats).some((value) => value > 0);
  }, [stats]);

  const formattedRevenue = useMemo(() => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(stats.totalRevenue);
  }, [stats.totalRevenue]);

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-4 text-sm text-slate-600">Loading stats...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      </main>
    );
  }

  if (!hasData) {
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-4 text-sm text-slate-600">No data available</p>
      </main>
    );
  }

  const cards = [
    { title: "Total Orders", value: stats.totalOrders.toLocaleString("en-IN") },
    { title: "Today Orders", value: stats.todayOrders.toLocaleString("en-IN") },
    { title: "Pending Orders", value: stats.pendingOrders.toLocaleString("en-IN") },
    { title: "Total Revenue", value: formattedRevenue },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">Overview of store performance.</p>
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.title}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.title}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
