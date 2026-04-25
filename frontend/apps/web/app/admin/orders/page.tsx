"use client";

import { useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Card, CardContent } from "@workspace/ui/components/card";
import { ChevronRight, MessageCircle, PhoneCall } from "lucide-react";

const STATUS_FLOW: Record<string, { next: string; label: string; color: string; nextLabel: string }> = {
  pending:          { next: "Accepted",         label: "Placed",           color: "bg-gray-100 text-gray-600",    nextLabel: "Accept" },
  placed:           { next: "Accepted",         label: "Placed",           color: "bg-gray-100 text-gray-600",    nextLabel: "Accept" },
  accepted:         { next: "Out for Delivery", label: "Accepted",         color: "bg-blue-100 text-blue-700",    nextLabel: "Out for Delivery" },
  "out for delivery": { next: "Delivered",      label: "Out for Delivery", color: "bg-amber-100 text-amber-700",  nextLabel: "Mark Delivered" },
  delivered:        { next: "",                 label: "Delivered",        color: "bg-emerald-100 text-emerald-700", nextLabel: "" },
};

function getStatusMeta(status: string) {
  const key = (status || "pending").toLowerCase();
  return STATUS_FLOW[key] || { next: "Accepted", label: "Placed", color: "bg-gray-100 text-gray-600", nextLabel: "Accept" };
}

function normalizePhone(phone?: string) {
  return (phone || "").trim().replace(/[\s()-]/g, "");
}

function getContactLinks(phone?: string) {
  const cleaned = normalizePhone(phone);
  if (!cleaned) return null;

  const whatsappNumber = cleaned.replace(/[^\d+]/g, "").replace(/^\+/, "");

  return {
    callHref: `tel:${cleaned}`,
    whatsappHref: `https://wa.me/${whatsappNumber}`,
  };
}

function getOrderId(order: any) {
  return typeof order?._id === "string" ? order._id : String(order?._id ?? "");
}

function formatOrderDateTime(value?: string) {
  if (!value) return "--";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getShortOrderId(order: any) {
  const id = getOrderId(order);
  return id ? id.slice(-6).toUpperCase() : "------";
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const ordersRef = useRef<any[]>([]);

  useEffect(() => {
    ordersRef.current = orders;
  }, [orders]);

  const TABS = [
    { label: "All",               value: "all" },
    { label: "Pending",           value: "pending" },
    { label: "Out for Delivery",  value: "out for delivery" },
    { label: "Delivered",         value: "delivered" },
  ];

  const filteredOrders = (filter === "all"
    ? orders
    : orders.filter((o) => (o.status || "pending").toLowerCase() === filter)
  ).slice().sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    return bTime - aTime;
  });

  const pendingCount = orders.filter((o) => ["pending", "placed", "accepted"].includes((o.status || "pending").toLowerCase())).length;
  const deliveredCount = orders.filter((o) => (o.status || "pending").toLowerCase() === "delivered").length;
  const totalVisibleValue = filteredOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  async function fetchOrders(options?: { silent?: boolean }) {
    try {
      const res = await adminFetch("/api/orders");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const nextOrders = Array.isArray(data) ? data : (data.orders || []);

      // During silent background refreshes, keep current list if API briefly returns empty.
      if (options?.silent && ordersRef.current.length > 0 && nextOrders.length === 0) {
        return;
      }

      setOrders(nextOrders);
      setHasLoadedOnce(true);
      setError(false);
    } catch {
      if (!options?.silent) {
        setError(true);
      }
    } finally {
      if (!options?.silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    fetchOrders();

    const intervalId = window.setInterval(() => {
      fetchOrders({ silent: true });
    }, 5000);

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchOrders({ silent: true });
      }
    };

    window.addEventListener("focus", onVisibilityChange);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", onVisibilityChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const previousOrders = orders;
    setUpdatingOrderId(id);
    setOrders((prev) => prev.map((o) => (getOrderId(o) === id ? { ...o, status } : o)));
    const res = await adminFetch("/api/orders/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });

    if (!res.ok) {
      const errorBody = await res.json().catch(() => null);
      console.error("Failed to update order status:", errorBody ?? res.statusText);
      setOrders(previousOrders);
      alert(errorBody?.error ?? "Failed to update order status.");
      setUpdatingOrderId(null);
      return;
    }

    await fetchOrders({ silent: true });
    setUpdatingOrderId(null);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and dispatch customer orders.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              filter === tab.value
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ml-1.5 text-xs opacity-70">
                ({orders.filter((o) => (o.status || "pending").toLowerCase() === tab.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs">
        {!hasLoadedOnce ? (
          <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
            Refreshing orders...
          </span>
        ) : (
          <>
            <span className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-semibold text-gray-700">
              Showing: {filteredOrders.length}
            </span>
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
              Action needed: {pendingCount}
            </span>
            <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">
              Delivered: {deliveredCount}
            </span>
            <span className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 font-semibold text-blue-700">
              Visible total: ₹{totalVisibleValue.toFixed(2)}
            </span>
          </>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded-full bg-gray-100" />
                  <div className="h-3 w-24 rounded-full bg-gray-100" />
                  <div className="h-3 w-40 rounded-full bg-gray-100" />
                </div>
                <div className="h-6 w-20 rounded-full bg-gray-100" />
              </div>
              <div className="h-16 rounded-lg bg-gray-50 mb-4" />
              <div className="h-8 w-28 rounded-lg bg-gray-100" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-16 px-6 text-center">
          <span className="text-4xl mb-3">⚠️</span>
          <h3 className="text-base font-bold text-red-700 mb-1">Failed to load orders</h3>
          <p className="text-sm text-red-500 mb-4">There was a problem connecting to the backend. Please try refreshing.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card className="shadow-none border border-gray-200">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-gray-500 text-sm">
              {filter === "all" ? "No orders yet." : `No ${filter} orders.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const meta = getStatusMeta(order.status);
            const contactLinks = getContactLinks(order.phone);
            return (
              <Card key={getOrderId(order)} className="shadow-none border border-gray-200 hover:border-gray-300 transition-colors">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    {/* Customer Info */}
                    <div>
                      <p className="text-[11px] font-semibold tracking-wide text-gray-400">ORDER #{getShortOrderId(order)}</p>
                      <h3 className="font-bold text-gray-900">{order.userName || "Guest"}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">📞 {normalizePhone(order.phone) || "—"}</p>
                      <p className="text-sm text-gray-500 mt-0.5">🕒 {order.deliverySlot || "—"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Placed: {formatOrderDateTime(order.createdAt)}</p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">📍 {order.address || "—"}</p>
                    </div>
                    {/* Status Badge */}
                    <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${meta.color}`}>
                      {meta.label}
                    </span>
                  </div>

                  {contactLinks && (
                    <div className="mb-4 flex flex-wrap gap-2">
                      <a
                        href={contactLinks.callHref}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <PhoneCall className="h-3.5 w-3.5" />
                        Call Customer
                      </a>
                      <a
                        href={contactLinks.whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition-colors hover:bg-green-100"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        Open WhatsApp
                      </a>
                    </div>
                  )}

                  {/* Items */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-4 space-y-1.5">
                    {order.items?.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between text-sm text-gray-700">
                        <span>{item.name}</span>
                        <span className="text-gray-500">× {item.quantity} &nbsp;·&nbsp; ₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-2 border-t border-gray-200 flex justify-between font-bold text-sm text-gray-900">
                      <span>Total</span>
                      <span className="text-emerald-600">₹{order.total}</span>
                    </div>
                  </div>

                  {/* Action Button — progress to next status */}
                  {meta.nextLabel ? (
                    <button
                      disabled={updatingOrderId === getOrderId(order)}
                      onClick={() => updateStatus(getOrderId(order), meta.next)}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {updatingOrderId === getOrderId(order) ? "Updating..." : meta.nextLabel} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="text-xs text-emerald-600 font-semibold">✓ Order complete</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
