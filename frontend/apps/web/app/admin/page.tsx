"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { ShoppingCart, Package, TrendingUp, Clock } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ totalOrders: 0, todaysOrders: 0, totalProducts: 0, revenue: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ordersRes, productsRes] = await Promise.all([
          fetch("/api/orders"),
          fetch("/api/products"),
        ]);
        const orders = ordersRes.ok ? await ordersRes.json() : [];
        let productsCount = 0;
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          productsCount = typeof productsData.total === "number" 
            ? productsData.total 
            : (Array.isArray(productsData) ? productsData.length : (productsData.products?.length || 0));
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        setStats({
          totalOrders: orders.length,
          todaysOrders: orders.filter((o: any) => o.createdAt && new Date(o.createdAt) >= today).length,
          totalProducts: productsCount,
          revenue: orders.reduce((s: number, o: any) => s + Number(o.total || 0), 0),
          pending: orders.filter((o: any) =>
            !o.status || ["pending", "placed"].includes(o.status.toLowerCase())
          ).length,
        });
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
                <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center mb-2`}>
                  <Icon className={`w-4 h-4 ${c.color}`} />
                </div>
                <CardTitle className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {c.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${c.color}`}>
                  {loading ? "—" : c.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
