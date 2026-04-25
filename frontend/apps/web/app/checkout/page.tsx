"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  Loader2,
  AlertCircle,
  MapPin,
  CheckCircle2,
  Plus,
  Home,
  Briefcase,
  Building2,
  ExternalLink,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useCart } from "@/store/cart";
import Link from "next/link";
import toast from "react-hot-toast";

const ORDERS_API_URL = "/api/orders";
const ADDRESS_API_URL = "/api/user/address";
const MINIMUM_ORDER_VALUE = 200;
const ONLINE_PAYMENTS_ENABLED = false; // Disabled for COD-only
const HAS_RAZORPAY_KEY = Boolean(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);

const DELIVERY_SLOTS = ["Morning", "Afternoon", "Evening"] as const;

type UserAddress = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
};

const LABEL_ICONS: Record<string, React.ReactNode> = {
  Home: <Home className="h-3.5 w-3.5" />,
  Work: <Briefcase className="h-3.5 w-3.5" />,
  Other: <Building2 className="h-3.5 w-3.5" />,
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, deliveryFee, total, clearCart } = useCart();
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod] = useState("cod"); // COD only
  const [deliverySlot, setDeliverySlot] = useState<(typeof DELIVERY_SLOTS)[number]>("Morning");

  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);

  const [deliveryDetails, setDeliveryDetails] = useState({
    userName: "",
    phone: "",
    address: "",
    notes: "",
  });

  const isMinimumOrderMet = subtotal >= MINIMUM_ORDER_VALUE;
  const minimumOrderShortfall = Math.max(0, MINIMUM_ORDER_VALUE - subtotal);
  const canUseOnlinePayment = false; // Always false for COD-only

  useEffect(() => {
    if (session) {
      setDeliveryDetails((prev) => ({
        ...prev,
        userName: session.user?.name || "",
      }));
      fetchAddresses();
    }
  }, [session]);

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await fetch(ADDRESS_API_URL);
      if (res.ok) {
        const data: UserAddress[] = await res.json();
        setSavedAddresses(data);
        const defaultAddr = data.find((a) => a.isDefault) ?? data[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
          setDeliveryDetails((prev) => ({ ...prev, address: defaultAddr.addressLine }));
        }
      }
    } catch {
      /* silently fail — user can type manually */
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const selectAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr.id);
    setDeliveryDetails((prev) => ({ ...prev, address: addr.addressLine }));
  };

  
  const submitOrder = async (formData: FormData | null): Promise<string | null> => {
    const userName = (formData?.get("name") as string) ?? deliveryDetails.userName;
    const phone = (formData?.get("phone") as string) ?? deliveryDetails.phone;
    const address = (formData?.get("address") as string) ?? deliveryDetails.address;
    const userId = session?.user && typeof session.user === "object" ? (session.user as { id?: string }).id : undefined;
    const userEmail = session?.user?.email ?? undefined;

    const normalizedPaymentMethod = "COD"; // Always COD

    const payload = {
      userName,
      phone,
      address,
      userId,
      userEmail,
      deliverySlot,
      subtotal: Number(subtotal),
      items: items.map((item) => ({
        productId: item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
      })),
      total: Number(total),
      paymentMethod: normalizedPaymentMethod,
      notes: deliveryDetails.notes.trim() || undefined,
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

      const resData = await response.json();
      return resData.orderId;
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not place your order. Please try again.";
      setStatusMessage(message);
      setIsSubmitting(false);
      return null;
    }
  };

  const placeOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (items.length === 0) {
      setStatusMessage("Add items to your cart before placing an order.");
      return;
    }

    if (!isMinimumOrderMet) {
      setStatusMessage(`Minimum order is Rs. ${MINIMUM_ORDER_VALUE}. Add Rs. ${minimumOrderShortfall} more to continue.`);
      return;
    }

    const formData = new FormData(event.currentTarget);
    setIsSubmitting(true);
    setStatusMessage("");

    const orderId = await submitOrder(formData);
    if (!orderId) return;

    clearCart();
    toast.success("Order placed successfully! 🎉");
    router.push(`/order-success?orderId=${encodeURIComponent(orderId)}`);
  };

  return (
    <>
      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-10 dark:bg-zinc-950">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.4fr_1fr]">

          {/* ── Left: Form ── */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
              Secure Checkout
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
              Delivery Details
            </h1>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm">
              Fill in your delivery details and choose a payment method.
            </p>

            <form onSubmit={placeOrder} className="mt-7 space-y-5">

              {/* Name */}
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={deliveryDetails.userName}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, userName: e.target.value })}
                  placeholder="Enter your full name"
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={deliveryDetails.phone}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, phone: e.target.value })}
                  placeholder="Enter your phone number"
                  className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              {/* ── Saved Address Picker ── */}
              {session && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Delivery Address
                    </label>
                    <Link
                      href="/profile"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                    >
                      <Plus className="h-3 w-3" /> Manage addresses
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>

                  {isLoadingAddresses ? (
                    <div className="flex gap-2">
                      {[1, 2].map((i) => (
                        <div key={i} className="h-16 flex-1 animate-pulse rounded-xl bg-zinc-100" />
                      ))}
                    </div>
                  ) : savedAddresses.length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {savedAddresses.map((addr) => {
                        const isSelected = selectedAddressId === addr.id;
                        const icon = LABEL_ICONS[addr.label] ?? <MapPin className="h-3.5 w-3.5" />;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => selectAddress(addr)}
                            className={`relative flex flex-col items-start gap-1 rounded-xl border-2 p-3.5 text-left transition-all ${
                              isSelected
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                                : "border-zinc-200 bg-white hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 className="absolute right-3 top-3 h-4 w-4 text-emerald-500" />
                            )}
                            <span className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                              isSelected ? "bg-emerald-600 text-white" : "bg-zinc-100 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                            }`}>
                              {icon} {addr.label}
                              {addr.isDefault && <span className="ml-1 opacity-70">• Default</span>}
                            </span>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 leading-snug line-clamp-2">
                              {addr.addressLine}
                            </p>
                            <p className="text-[11px] text-zinc-400">{addr.city} – {addr.pincode}</p>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-800">
                      <p className="text-sm text-zinc-500">No saved addresses</p>
                      <Link
                        href="/profile"
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <Plus className="h-3 w-3" /> Add one
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Manual address override */}
              <div>
                <label htmlFor="address" className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  {session && savedAddresses.length > 0
                    ? "Or type a different address"
                    : "Full Address"}
                </label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={deliveryDetails.address}
                  onChange={(e) => {
                    setDeliveryDetails({ ...deliveryDetails, address: e.target.value });
                    setSelectedAddressId(null); // deselect saved on manual edit
                  }}
                  placeholder="House no, street, area, and landmark"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                  required
                />
              </div>

              {/* Order notes */}
              <div>
                <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Order Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  value={deliveryDetails.notes}
                  onChange={(e) => setDeliveryDetails({ ...deliveryDetails, notes: e.target.value })}
                  placeholder="Example: Don't add onions"
                  maxLength={500}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                  Add any special requests or instructions for your order.
                </p>
              </div>

              {/* Payment method - COD only */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800 dark:bg-emerald-950/20">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-4 rounded-full border-2 border-emerald-600 bg-emerald-600"></div>
                  <div>
                    <p className="font-semibold text-emerald-900 dark:text-emerald-100 text-sm">Cash on Delivery</p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">Pay when order arrives</p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">
                  Simple and secure - pay only when you receive your order.
                </p>
              </div>

              {/* Delivery slot */}
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                  Delivery Slot
                </legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {DELIVERY_SLOTS.map((slot) => (
                    <label
                      key={slot}
                      className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-3 py-3 text-sm font-semibold transition-all ${
                        deliverySlot === slot
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20"
                          : "border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliverySlot"
                        value={slot}
                        checked={deliverySlot === slot}
                        onChange={(e) => setDeliverySlot(e.target.value as (typeof DELIVERY_SLOTS)[number])}
                        className="sr-only"
                      />
                      {slot}
                    </label>
                  ))}
                </div>
              </fieldset>

              {!isMinimumOrderMet && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200">
                  Minimum order is Rs. {MINIMUM_ORDER_VALUE}. Add Rs. {minimumOrderShortfall} more to place this order.
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting || items.length === 0 || !isMinimumOrderMet}
                className="inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-60"
                style={{ height: "52px" }}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Placing order...</>
                ) : (
                  `Place Order — Rs. ${total}`
                )}
              </button>

              {/* Error */}
              {statusMessage && (
                <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-sm font-medium text-red-700 flex-1">{statusMessage}</p>
                  <button
                    type="button"
                    onClick={() => setStatusMessage("")}
                    className="text-red-400 hover:text-red-600 text-xs font-bold leading-none"
                    aria-label="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              )}
            </form>
          </section>

          {/* ── Right: Order Summary ── */}
          <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Order Summary</h2>
            <div className="mt-4 space-y-3 text-sm">
              {items.length === 0 ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <p className="text-zinc-500 dark:text-zinc-400">Your cart is empty.</p>
                  <Link href="/shop" className="mt-3 text-sm font-semibold text-emerald-600 hover:underline">
                    Browse products →
                  </Link>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">{item.name}</p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Rs. {item.price} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-bold text-zinc-900 dark:text-zinc-100 tabular-nums">
                        Rs. {item.price * item.quantity}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <p>Subtotal</p>
                  <p>Rs. {subtotal}</p>
                </div>
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <p>Delivery</p>
                  <p className={deliveryFee === 0 ? "text-emerald-600 font-semibold" : ""}>
                    {deliveryFee === 0 ? "FREE" : `Rs. ${deliveryFee}`}
                  </p>
                </div>
                <div className="border-t border-zinc-100 pt-2 dark:border-zinc-800">
                  <div className="flex items-center justify-between text-base font-bold text-zinc-900 dark:text-zinc-100">
                    <p>Total</p>
                    <p>Rs. {total}</p>
                  </div>
                </div>
              </div>
            </div>

            <Link
              href="/cart"
              className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              ← Edit Cart
            </Link>
          </aside>
        </div>
      </main>
    </>
  );
}
