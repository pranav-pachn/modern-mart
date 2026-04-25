"use client";

import { useCart } from "@/store/cart";

export default function CartPage() {
  const {
    items,
    subtotal,
    deliveryFee,
    total,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-10 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                Cart
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                Review your selected products before checkout.
              </p>
            </div>

            <div className="flex gap-3">
              <a
                href="/shop"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Continue shopping
              </a>
              <button
                type="button"
                onClick={clearCart}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                Clear cart
              </button>
            </div>
          </div>
        </section>

        {items.length === 0 ? (
          <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-gray-200 bg-gray-50 py-24 px-6 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-3">Cart is empty 🛒</h2>
            <p className="text-gray-500 max-w-xs mb-8 leading-relaxed">
              Looks like you haven't added any groceries yet. Start shopping to fill it up!
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="/shop" className="lp-cta-btn">Browse Products →</a>
              <a href="/ai" className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50">
                ✨ Try AI Grocery
              </a>
            </div>
          </section>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                Items ({items.length})
              </h2>

              <div className="mt-5 flex flex-col gap-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.category}</p>
                        <h3 className="mt-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">
                          {item.name}
                        </h3>
                        <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.unit}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="text-sm font-semibold text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="inline-flex items-center rounded-xl border border-zinc-300 dark:border-zinc-700">
                        <button
                          type="button"
                          onClick={() => decreaseQuantity(item.id)}
                          className="h-11 w-11 sm:h-9 sm:w-9 text-lg font-bold text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          -
                        </button>
                        <p className="min-w-10 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {item.quantity}
                        </p>
                        <button
                          type="button"
                          onClick={() => increaseQuantity(item.id)}
                          className="h-11 w-11 sm:h-9 sm:w-9 text-lg font-bold text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
                        >
                          +
                        </button>
                      </div>

                      <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100">
                        Rs. {item.price * item.quantity}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="h-fit rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Order summary</h2>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                  <p>Subtotal</p>
                  <p>Rs. {subtotal}</p>
                </div>
                <div className="flex items-center justify-between text-zinc-600 dark:text-zinc-300">
                  <p>Delivery fee</p>
                  <p>Rs. {deliveryFee}</p>
                </div>
                <div className="border-t border-zinc-200 pt-3 text-base font-bold text-zinc-900 dark:border-zinc-700 dark:text-zinc-100">
                  <div className="flex items-center justify-between">
                    <p>Total price</p>
                    <p>Rs. {total}</p>
                  </div>
                </div>
              </div>

              <a
                href="/checkout"
                className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Proceed to checkout
              </a>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

