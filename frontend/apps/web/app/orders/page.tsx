"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, ChevronRight, Clock3, Loader2, PackageCheck, ReceiptText } from "lucide-react";
import { apiFetch } from "@/lib/api-client";

type Order = {
  id: string;
  _id: string;
  userName: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(value);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusTone(status: string) {
  const value = status.toLowerCase();
  if (value === "delivered") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (value === "cancelled") return "bg-red-50 text-red-700 border-red-200";
  if (value === "pending" || value === "placed") return "bg-orange-50 text-orange-700 border-orange-200";
  return "bg-blue-50 text-blue-700 border-blue-200";
}

export default function OrdersPage() {
  const { status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiFetch("/api/user/orders");
        if (!response.ok) {
          throw new Error("Unable to load your orders.");
        }
        const data = (await response.json()) as Order[];
        setOrders(Array.isArray(data) ? data : []);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Unable to load your orders.");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      void loadOrders();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
          <p className="text-sm text-zinc-600">Loading your orders...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-3xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
          <ReceiptText className="mx-auto h-12 w-12 text-zinc-300" />
          <h1 className="mt-4 text-2xl font-bold text-zinc-900">Sign in to view your orders</h1>
          <p className="mt-2 text-sm text-zinc-500">Your order history is available after you log in.</p>
          <Link href="/login" className="mt-6 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Profile
        </Link>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">Customer Area</p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-zinc-900">My Orders</h1>
              <p className="mt-2 text-sm text-zinc-500">View your past orders and open any order for full details.</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <PackageCheck className="h-5 w-5" />
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          ) : orders.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
              <Clock3 className="mx-auto h-10 w-10 text-zinc-300" />
              <p className="mt-3 text-base font-semibold text-zinc-900">No orders yet</p>
              <p className="mt-1 text-sm text-zinc-500">Your past orders will show up here after checkout.</p>
              <Link href="/shop" className="mt-5 inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {orders.map((order) => (
                <Link key={order.id} href={`/order/${order.id}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition hover:border-emerald-200 hover:bg-emerald-50/30 hover:shadow-sm">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">Order #{order.id.slice(-6).toUpperCase()}</p>
                    <p className="mt-1 text-xs text-zinc-500">Placed {formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                    <span className="text-sm font-semibold text-zinc-900">{formatCurrency(order.total)}</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getStatusTone(order.status)}`}>{order.status}</span>
                    <ChevronRight className="h-4 w-4 text-zinc-400 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}