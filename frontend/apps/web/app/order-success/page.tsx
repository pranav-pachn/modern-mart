"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function OrderSuccessPage() {
  const [show, setShow] = useState(false);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const receiptNumber = orderId ? orderId.slice(-6).toUpperCase() : "PENDING";

  useEffect(() => {
    // Trigger entrance animation after mount
    const t = setTimeout(() => setShow(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <main className="lp-root bg-white min-h-screen flex items-center justify-center px-4 py-16">
      {/* Background blobs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-emerald-100/60 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-100/50 blur-3xl" />
      </div>

      <div
        className="relative z-10 flex flex-col items-center text-center max-w-lg w-full"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.5s ease, transform 0.5s ease",
        }}
      >
        {/* Success icon with pulse ring */}
        <div className="relative mb-8">
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-2xl shadow-emerald-200">
            <svg
              width="44"
              height="44"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        {/* Headline */}
        <span className="lp-section-label mb-2">Panchavati Mart</span>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl mb-4">
          Order Placed!
        </h1>
        <p className="text-lg text-gray-500 leading-relaxed max-w-md">
          Your order has been successfully placed and is being prepared.
          We'll deliver it fresh to your door in Bodhan.
        </p>

        <div className="mt-8 w-full rounded-2xl border border-gray-200 bg-white/90 p-5 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">Receipt</p>
          <div className="mt-3 flex items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-sm font-medium text-gray-500">Order Number</p>
              <p className="mt-1 text-2xl font-black tracking-tight text-gray-900">
                Order #{receiptNumber}
              </p>
            </div>
            <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Confirmed
            </div>
          </div>
          {orderId && (
            <p className="mt-3 break-all text-xs text-gray-400">
              Reference ID: {orderId}
            </p>
          )}
        </div>

        {/* Order status card */}
        <div className="mt-6 w-full rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-3xl">📦</span>
            <div className="text-left">
              <p className="font-bold text-gray-900">Your order is confirmed</p>
              <p className="text-sm text-emerald-700 font-semibold mt-0.5">
                Estimated delivery: 25–40 minutes
              </p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2">
            <div className="flex-none flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">Order Placed</span>
            </div>
            <div className="flex-1 h-1 rounded-full bg-emerald-300" />
            <div className="flex-none flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 whitespace-nowrap">Packed</span>
            </div>
            <div className="flex-1 h-1 rounded-full bg-gray-200" />
            <div className="flex-none flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-sm">🚴</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">On the Way</span>
            </div>
            <div className="flex-1 h-1 rounded-full bg-gray-200" />
            <div className="flex-none flex flex-col items-center gap-1">
              <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-dashed border-gray-300 flex items-center justify-center">
                <span className="text-sm">🏠</span>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">Delivered</span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full">
          {orderId && (
            <Link href={`/order/${orderId}`} className="lp-cta-btn flex-1 justify-center">
              Track Order
            </Link>
          )}
          <Link href="/shop" className="lp-cta-btn flex-1 justify-center">
            Continue Shopping →
          </Link>
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:shadow-sm"
          >
            Back to Home
          </Link>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          Questions? Call us at{" "}
          <a href="tel:+911234567890" className="text-emerald-600 font-semibold">
            +91 12345 67890
          </a>
        </p>
      </div>
    </main>
  );
}
