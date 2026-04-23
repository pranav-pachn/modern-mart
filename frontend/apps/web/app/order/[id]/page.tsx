"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle2, 
  Package, 
  XCircle,
  ShoppingBag,
  MapPin,
  Phone,
  User,
  CreditCard
} from "lucide-react";

type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type Order = {
  _id: string;
  userName: string;
  phone: string;
  address: string;
  items: OrderItem[];
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
};

const STATUS_STEPS = [
  { id: "placed", label: "Placed", icon: ShoppingBag },
  { id: "confirmed", label: "Confirmed", icon: Package },
  { id: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function normalizeOrderStatus(status: string | undefined): "placed" | "confirmed" | "delivered" | "cancelled" {
  const value = (status ?? "pending").toLowerCase();
  if (value === "delivered") return "delivered";
  if (value === "cancelled") return "cancelled";
  if (["accepted", "confirmed", "packed", "out for delivery"].includes(value)) return "confirmed";
  return "placed";
}

function getStatusLabel(status: "placed" | "confirmed" | "delivered" | "cancelled") {
  if (status === "cancelled") return "Cancelled";
  if (status === "delivered") return "Delivered";
  if (status === "confirmed") return "Confirmed";
  return "Placed";
}

export default function OrderTrackingPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load order details");
        }
        const data = await res.json();
        setOrder(data);
      } catch (e: any) {
        setError(e.message || "Could not load the order details.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="h-64 w-full bg-gray-200 rounded-2xl animate-pulse mb-6" />
          <div className="h-64 w-full bg-gray-200 rounded-2xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-20">
        <div className="mx-auto flex max-w-md flex-col items-center text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Order Not Found</h1>
          <p className="mb-8 text-gray-500">{error || "The order you're looking for doesn't exist or you don't have permission to view it."}</p>
          <Link href="/shop" className="inline-flex h-12 items-center justify-center rounded-xl bg-emerald-600 px-6 font-bold text-white transition hover:bg-emerald-700">
            Back to Shop
          </Link>
        </div>
      </main>
    );
  }

  // Determine current step index
  const currentStatus = normalizeOrderStatus(order.status);
  const isCancelled = currentStatus === "cancelled";
  
  let currentStepIndex = 0;
  if (currentStatus === "confirmed") currentStepIndex = 1;
  else if (currentStatus === "delivered") currentStepIndex = 2;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8 pb-24">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/profile"
            className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Profile
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Order Tracking
              </h1>
              <p className="mt-1 text-sm text-zinc-500 flex items-center gap-2">
                <span className="font-mono bg-zinc-200 px-2 py-0.5 rounded text-zinc-700">#{order._id.slice(-8).toUpperCase()}</span>
                <span>•</span>
                <span>{new Date(order.createdAt).toLocaleDateString("en-IN", {
                  year: 'numeric', month: 'short', day: 'numeric',
                  hour: '2-digit', minute: '2-digit'
                })}</span>
              </p>
            </div>
            <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold capitalize ${
              isCancelled ? "bg-red-100 text-red-700" :
              currentStatus === "delivered" ? "bg-emerald-100 text-emerald-700" :
              "bg-blue-100 text-blue-700"
            }`}>
              {getStatusLabel(currentStatus)}
            </span>
          </div>
        </div>

        <div className="space-y-6">
          {/* Status Timeline */}
          <section className="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900 mb-6">Order Status</h2>
            
            {isCancelled ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mb-3" />
                <h3 className="text-lg font-bold text-red-700">Order Cancelled</h3>
                <p className="text-sm text-zinc-500 mt-1">This order was cancelled and will not be delivered.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Connecting Line Background */}
                <div className="absolute top-5 left-6 right-6 h-1 bg-zinc-100 rounded-full hidden sm:block" />
                {/* Connecting Line Fill */}
                <div 
                  className="absolute top-5 left-6 h-1 bg-emerald-500 rounded-full hidden sm:block transition-all duration-500" 
                  style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%`, maxWidth: 'calc(100% - 3rem)' }} 
                />

                <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-0 relative z-10">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index <= currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const Icon = step.icon;
                    
                    return (
                      <div key={step.id} className="flex sm:flex-col items-center sm:text-center gap-4 sm:gap-3 flex-1 relative">
                        {/* Mobile line connecting steps vertically */}
                        {index !== STATUS_STEPS.length - 1 && (
                          <div className="absolute left-5 top-10 bottom-[-1.5rem] w-0.5 bg-zinc-100 sm:hidden" />
                        )}
                        {isCompleted && index !== STATUS_STEPS.length - 1 && (
                          <div className="absolute left-5 top-10 bottom-[-1.5rem] w-0.5 bg-emerald-500 sm:hidden" />
                        )}

                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ring-white transition-colors duration-300 ${
                          isCompleted ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
                        } ${isCurrent ? "ring-emerald-100 scale-110" : ""}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${isCompleted ? "text-zinc-900" : "text-zinc-400"}`}>
                            {step.label}
                          </p>
                          {isCurrent && (
                            <p className="text-xs text-emerald-600 font-medium mt-0.5 sm:mx-auto">Current status</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Delivery & Payment Details */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col gap-5">
              <h2 className="text-lg font-bold text-zinc-900">Order Details</h2>
              
              <div className="flex gap-3 text-sm text-zinc-700">
                <User className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium text-zinc-900">Customer</p>
                  <p>{order.userName}</p>
                </div>
              </div>

              <div className="flex gap-3 text-sm text-zinc-700">
                <Phone className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium text-zinc-900">Contact</p>
                  <p>{order.phone}</p>
                </div>
              </div>

              <div className="flex gap-3 text-sm text-zinc-700">
                <MapPin className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium text-zinc-900">Delivery Address</p>
                  <p className="leading-relaxed">{order.address}</p>
                </div>
              </div>

              <div className="flex gap-3 text-sm text-zinc-700">
                <CreditCard className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-medium text-zinc-900">Payment</p>
                  <p>{order.paymentMethod?.toUpperCase() === "ONLINE" ? "Online Payment" : "Cash on Delivery"}</p>
                  <span className={`inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                    order.paymentStatus === "success" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {order.paymentStatus === "success" ? "Paid" : "Pending"}
                  </span>
                </div>
              </div>
            </section>

            {/* Order Items & Summary */}
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">Items Summary</h2>
              
              <div className="space-y-4 max-h-[280px] overflow-y-auto pr-2 mb-6">
                {order.items.map((item, idx) => (
                  <div key={`${item.productId}-${idx}`} className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-sm text-zinc-900 truncate">{item.name}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">₹{item.price} × {item.quantity}</p>
                    </div>
                    <p className="font-bold text-sm text-zinc-900 whitespace-nowrap">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>

              <div className="mt-auto border-t border-zinc-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-zinc-600">
                  <p>Subtotal</p>
                  <p>₹{order.total}</p>
                </div>
                <div className="flex justify-between text-sm text-zinc-600">
                  <p>Delivery Fee</p>
                  <p className="text-emerald-600 font-medium">Free</p>
                </div>
                <div className="border-t border-zinc-100 pt-2 mt-2">
                  <div className="flex justify-between text-base font-bold text-zinc-900">
                    <p>Total Amount</p>
                    <p>₹{order.total}</p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
