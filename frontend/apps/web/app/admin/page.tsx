"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ShoppingCart, Package, TrendingUp, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, todaysOrders: 0, totalProducts: 0, revenue: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // Use targeted, lean endpoints instead of fetching full collections
        const [statsRes, productsRes] = await Promise.all([
          fetch("/api/orders?stats=1"),
          fetch("/api/products?page=1&limit=1"),
        ]);
        if (!statsRes.ok || !productsRes.ok) throw new Error("fetch failed");

        const statsData = await statsRes.json();
        const productsData = await productsRes.json();

        const productsCount = typeof productsData.total === "number"
          ? productsData.total
          : (productsData.products?.length ?? 0);

        setStats({
          totalOrders:  statsData.totalOrders  ?? 0,
          todaysOrders: statsData.todayOrders   ?? 0,
          totalProducts: productsCount,
          revenue:       statsData.revenue       ?? 0,
          pending:       statsData.pendingOrders ?? 0,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);


  const cards = [
    { title: "Total Orders",     value: stats.totalOrders,                      icon: ShoppingCart, color: "text-blue-600",    bg: "bg-blue-50" },
    { title: "Today's Orders",   value: stats.todaysOrders,                     icon: ShoppingCart, color: "text-indigo-600",  bg: "bg-indigo-50" },
    { title: "Pending Orders",   value: stats.pending,                          icon: Clock,        color: "text-amber-600",   bg: "bg-amber-50" },
    { title: "Revenue (₹)",      value: `₹${stats.revenue.toLocaleString()}`,   icon: TrendingUp,   color: "text-emerald-600", bg: "bg-emerald-50" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Welcome back! Here's an overview of your store.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.title} className="shadow-none border border-gray-200">
              <CardHeader className="pb-2">
                <div className={`w-9 h-9 rounded-lg ${loading ? "bg-gray-100" : c.bg} flex items-center justify-center mb-2 transition-colors`}>
                  {loading ? <div className="w-4 h-4 rounded bg-gray-200 animate-pulse" /> : <Icon className={`w-4 h-4 ${c.color}`} />}
                </div>
                <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-8 w-20 rounded-lg bg-gray-100 animate-pulse" />
                ) : error ? (
                  <p className="text-lg font-bold text-red-400">—</p>
                ) : (
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-medium">
          <span className="text-lg">⚠️</span>
          Could not load dashboard data. Check your backend connection and try refreshing.
        </div>
      )}

      <Card className="shadow-none border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-4">🏪</div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Store is Live</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Use the sidebar to manage your inventory and handle customer orders.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
