"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCart } from "@/store/cart";

const ORDERS_API_URL = "/api/orders";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [deliveryDetails, setDeliveryDetails] = useState({
    userName: "",
    phone: "",
    address: "",
  });


  const handlePayment = async (formData: FormData) => {
    try {
      const res = await fetch("/api/payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total }),
      });

      if (!res.ok) {
        throw new Error("Payment init failed");
      }

      const data = await res.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "Grocery Mart",
        order_id: data.id,
        handler: async function (response: any) {
          await submitOrder(formData, response.razorpay_payment_id);
        },
      };

      if (!(window as any).Razorpay) {
        setStatusMessage("Razorpay checkout is unavailable. Disable browser blocker or choose COD.");
        setIsSubmitting(false);
        return;
      }

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      setStatusMessage("Payment failed. Please try again.");
      setIsSubmitting(false);
    }
  };

  const submitOrder = async (formData: FormData | null, paymentId?: string) => {
    const userName = formData?.get("name") as string ?? deliveryDetails.userName;
    const phone = formData?.get("phone") as string ?? deliveryDetails.phone;
    const address = formData?.get("address") as string ?? deliveryDetails.address;

    const payload = {
      userName,
      phone,
      address,
      items: items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      total: Number(total),
      paymentMethod,
      paymentId,
    };

    try {
      const response = await fetch(ORDERS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error ?? "Order request failed");
      }

      clearCart();
      router.push("/shop");
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not place your order. Please try again.";
      setStatusMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (items.length === 0) {
      setStatusMessage("Add items to your cart before placing an order.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setDeliveryDetails({
      userName: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
    });

    setIsSubmitting(true);
    setStatusMessage("");

    if (paymentMethod === "online") {
      await handlePayment(formData);
      return;
    }

    const payload = {
      userName: String(formData.get("name") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      address: String(formData.get("address") ?? ""),
      items: items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      total: Number(total),
      paymentMethod,
    };

    try {
      const response = await fetch(ORDERS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        throw new Error(errorBody?.error ?? "Order request failed");
      }

      clearCart();
      router.push("/shop");
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not place your order. Please try again.";
      setStatusMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
        onError={() => {
          setStatusMessage("Razorpay checkout was blocked in your browser. Disable blocker for this site or use COD.");
        }}
      />
      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-10 dark:bg-zinc-950">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
            Secure Checkout
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
            Checkout Page
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            Fill in your delivery details and choose a payment method.
          </p>

          <form onSubmit={placeOrder} className="mt-6 space-y-5">
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="Enter your full name"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label htmlFor="phone" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                placeholder="Enter your phone number"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <div>
              <label
                htmlFor="address"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Address
              </label>
              <textarea
                id="address"
                name="address"
                rows={4}
                placeholder="House no, street, area, and landmark"
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                required
              />
            </div>

            <fieldset>
              <legend className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Payment method
              </legend>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-300 p-3 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === "cod"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">COD</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">Cash on Delivery</p>
                  </div>
                </label>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-300 p-3 transition hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === "online"}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 accent-emerald-600"
                  />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">Online</p>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">UPI / Card / Net Banking</p>
                  </div>
                </label>
              </div>
            </fieldset>

            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700 sm:w-auto"
            >
              {isSubmitting ? "Placing order..." : "Place order"}
            </button>

            {statusMessage ? (
              <p className="text-sm font-medium text-red-600">{statusMessage}</p>
            ) : null}
          </form>
        </section>

        <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Order details</h2>
          <div className="mt-4 space-y-3 text-sm">
            {items.length === 0 ? (
              <p className="text-zinc-600 dark:text-zinc-300">Your cart is empty.</p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">{item.name}</p>
                      <p className="text-zinc-500 dark:text-zinc-400">
                        Rs. {item.price} x {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                      Rs. {item.price * item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
              <p>Subtotal</p>
              <p>Rs. {subtotal}</p>
            </div>
            <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
              <p>Delivery</p>
              <p>Rs. {deliveryFee}</p>
            </div>
            <div className="border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <div className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                <p>Total</p>
                <p>Rs. {total}</p>
              </div>
            </div>
          </div>

          <a
            href="/cart"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Back to cart
          </a>
        </aside>
      </div>
    </main>
    </>
  );
}
