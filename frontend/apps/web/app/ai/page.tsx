"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";
import {
  Sparkles,
  ShoppingBag,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  Minus,
  ArrowLeft,
  ChefHat,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { AiResultSkeleton } from "@/components/Skeletons";
import { useSession } from "next-auth/react";
import { saveAiHistory } from "@/lib/ai-history";
import { apiFetch } from "@/lib/api-client";
import toast from "react-hot-toast";

type MatchedItem = {
  item: string;
  qty: string;
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
    price: number;
    rating: number;
    image?: string;
    stock?: number;
  } | null;
  suggested?: boolean;
};

const EXAMPLE_PROMPTS = [
  "Paneer butter masala for 4 people",
  "Birthday cake for 10 people",
  "Aloo paratha breakfast for 2",
  "Dal tadka with rice for 6",
  "Palak paneer and roti for 2",
  "Chicken biryani for 8 people",
];

export default function AIGroceryPage() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<MatchedItem[]>([]);
  const [suggestedResults, setSuggestedResults] = useState<MatchedItem[]>([]);
  const [manualItem, setManualItem] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const { data: session } = useSession();

  const handleAddManualItem = async () => {
    if (!manualItem.trim()) return;
    try {
      const matchRes = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [{ item: manualItem, qty: "1" }] }),
      });
      if (matchRes.ok) {
        const matched: MatchedItem[] = await matchRes.json();
        setResults(prev => [...prev, ...matched]);
        setManualItem("");
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const generateList = async (promptText?: string) => {
    const query = promptText ?? input;
    if (!query.trim()) return;

    setIsLoading(true);
    setErrorPrompt("");
    setResults([]);
    setSuggestedResults([]);
    setHasGenerated(false);
    if (promptText) setInput(promptText);

    try {
      const res = await apiFetch("/api/ai", {
        method: "POST",
        body: JSON.stringify({ prompt: query }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "AI fetch failed");
      }

      const data = await res.json();

      let parsedItems: any[] = [];
      let parsedSuggested: any[] = [];
      try {
        const rawResult = typeof data.result === "string" ? JSON.parse(data.result) : data.result;
        if (Array.isArray(rawResult)) {
          parsedItems = rawResult;
        } else if (rawResult && typeof rawResult === "object") {
          parsedItems = Array.isArray(rawResult.items) ? rawResult.items : [];
          parsedSuggested = Array.isArray(rawResult.suggested) ? rawResult.suggested : [];
        }
      } catch {
        throw new Error("Could not understand the AI response. Please try again.");
      }

      if (parsedItems.length === 0) {
        throw new Error("No grocery items found. Try being more specific.");
      }

      // Match with DB
      const matchRes = await apiFetch("/api/ai/match", {
        method: "POST",
        body: JSON.stringify({ items: [...parsedItems, ...parsedSuggested] }),
      });

      if (!matchRes.ok) {
        throw new Error("Could not match items to the catalog.");
      }

      const matched: MatchedItem[] = await matchRes.json();
      const finalResults = matched.slice(0, parsedItems.length);
      const finalSuggested = matched.slice(parsedItems.length);
      
      setResults(finalResults);
      setSuggestedResults(finalSuggested);
      setHasGenerated(true);

      await saveAiHistory(query, finalResults, finalSuggested, session);
    } catch (e: any) {
      setErrorPrompt(e.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") generateList();
  };

  const addAllToCart = () => {
    const available = results.filter((r) => r.product);
    available.forEach((r) => {
      if (r.product) addToCart(r.product);
    });
    if (available.length > 0) {
      toast.success(`${available.length} item${available.length > 1 ? "s" : ""} added to cart!`);
    }
  };

  const availableCount = results.filter((r) => r.product).length;
  const unavailableCount = results.length - availableCount;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#d1fae5_0%,_#f0fdf4_30%,_#ffffff_70%)]">
      {/* Ambient blurs */}
      <div className="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-20 h-80 w-80 rounded-full bg-teal-200/25 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-100/40 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">

        {/* Nav */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-700 backdrop-blur transition hover:bg-white hover:shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            href="/cart"
            className="relative inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
          >
            <ShoppingBag className="h-4 w-4" />
            Cart
            {cart.length > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
                {cart.reduce((s, i) => s + i.quantity, 0)}
              </span>
            )}
          </Link>
          <Link
            href="/ai-history"
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-4 py-2 text-sm font-semibold text-zinc-700 backdrop-blur transition hover:bg-white hover:shadow-sm"
          >
            History
          </Link>
        </div>

        {/* Hero */}
        <section className="rounded-3xl border border-emerald-100/80 bg-white/80 p-8 shadow-2xl shadow-emerald-100/50 backdrop-blur sm:p-10">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200">
              <Sparkles className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-emerald-700">
                Powered by Gemini AI
              </p>
              <h1 className="mt-1 text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl">
                AI Grocery Generator
              </h1>
              <p className="mt-2 text-zinc-500">
                Tell us what you're cooking — we'll build the perfect grocery list and match it to our catalog instantly.
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              placeholder="E.g. Paneer butter masala for 4 people..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="h-13 flex-1 rounded-2xl border border-zinc-200 bg-white px-5 py-3 text-zinc-900 outline-none ring-emerald-400 transition placeholder:text-zinc-400 focus:ring-2 disabled:opacity-60"
            />
            <button
              onClick={() => generateList()}
              disabled={isLoading || !input.trim()}
              className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-7 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Generate List
                </>
              )}
            </button>
          </div>

          {/* Example prompts */}
          <div className="mt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Try an example
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => generateList(p)}
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2 min-h-[44px] text-xs font-medium text-zinc-600 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 disabled:pointer-events-none disabled:opacity-50"
                >
                  <ChefHat className="h-3.5 w-3.5" />
                  {p}
                </button>
              ))}
            </div>
          </div>

          {errorPrompt && (
            <div className="mt-5 flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              <XCircle className="h-4 w-4 shrink-0" />
              {errorPrompt}
            </div>
          )}
        </section>

        {isLoading && <AiResultSkeleton />}

        {/* Empty state: generated but nothing in catalog */}
        {hasGenerated && results.length > 0 && availableCount === 0 && (
          <section className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/80 py-16 px-6 text-center backdrop-blur">
            <span className="text-6xl mb-5" aria-hidden="true">🥲</span>
            <h3 className="text-xl font-bold text-zinc-900 mb-2">No matching items in store</h3>
            <p className="text-zinc-500 text-sm max-w-xs mb-6">
              We generated a list, but none of the ingredients are currently in our catalog. Try a different dish or check back later!
            </p>
            <button
              onClick={() => { setResults([]); setHasGenerated(false); setInput(""); }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
            >
              Try Another Dish
            </button>
          </section>
        )}

        {/* Results */}
        {hasGenerated && results.length > 0 && availableCount > 0 && (
          <section className="flex flex-col gap-6">
            {/* Stats bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white/80 px-5 py-3 backdrop-blur">
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  {availableCount} in catalog
                </span>
                {unavailableCount > 0 && (
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <XCircle className="h-4 w-4" />
                    {unavailableCount} not found
                  </span>
                )}
              </div>
              <button
                onClick={addAllToCart}
                disabled={availableCount === 0}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:pointer-events-none disabled:opacity-40"
              >
                <ShoppingBag className="h-4 w-4" />
                Add All {availableCount > 0 ? `(${availableCount})` : ""} to Cart
              </button>
            </div>

            {/* Grid */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((item, i) => {
                const cartItem = item.product
                  ? cart.find((c) => c.id === item.product!.id)
                  : undefined;

                return (
                  <div
                    key={i}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                      item.product
                        ? "border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30 hover:border-emerald-200 hover:shadow-md"
                        : "border-dashed border-zinc-200 bg-zinc-50/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold capitalize text-zinc-900">{item.item}</p>
                          {item.suggested && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                              Suggested Match
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-zinc-500">Qty: {item.qty}</p>
                      </div>
                      {item.product ? (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                      ) : (
                        <XCircle className="h-5 w-5 shrink-0 text-zinc-300" />
                      )}
                    </div>

                    {item.product ? (
                      <div className="mt-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-zinc-400">{item.product.name}</p>
                            <p className="text-lg font-bold text-zinc-900">₹{item.product.price}</p>
                          </div>
                          {item.product.category && (
                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-500">
                              {item.product.category}
                            </span>
                          )}
                        </div>

                        {/* Cart Controls */}
                        <div className="mt-3">
                          {cartItem ? (
                            <div className="flex h-11 items-center justify-between rounded-xl bg-emerald-600 text-white">
                              <button
                                onClick={() => decreaseQuantity(item.product!.id)}
                                className="flex h-full w-10 items-center justify-center rounded-l-xl transition hover:bg-emerald-700"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="text-sm font-bold">{cartItem.quantity}</span>
                              <button
                                onClick={() => increaseQuantity(item.product!.id)}
                                className="flex h-full w-10 items-center justify-center rounded-r-xl transition hover:bg-emerald-700"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { addToCart(item.product!); toast.success(`${item.product!.name} added to cart`); }}
                              className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-700"
                            >
                              Add to Cart
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-xs font-medium text-red-400">
                        Not available in our store currently
                      </p>
                    )}
                  </div>
                );
              })}
            </div>


            {/* Add missing items manually */}
            <div className="mt-2 flex items-center gap-3">
              <input
                type="text"
                placeholder="Missing something? Add manually..."
                value={manualItem}
                onChange={(e) => setManualItem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddManualItem()}
                className="h-11 flex-1 rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                onClick={handleAddManualItem}
                disabled={!manualItem.trim()}
                className="flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-50"
              >
                Add Item
              </button>
            </div>

            {/* Suggested items */}
            {suggestedResults.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-4 text-lg font-bold text-zinc-900">You might also need:</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {suggestedResults.map((item, i) => {
                    const cartItem = item.product ? cart.find((c) => c.id === item.product!.id) : undefined;
                    return (
                      <div key={`sugg-${i}`} className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${item.product ? "border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30 hover:border-emerald-200 hover:shadow-md" : "border-dashed border-zinc-200 bg-zinc-50/60"}`}>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold capitalize text-zinc-900">{item.item}</p>
                            <p className="mt-0.5 text-xs text-zinc-500">Suggested</p>
                          </div>
                          {item.product ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="h-5 w-5 shrink-0 text-zinc-300" />}
                        </div>
                        {item.product ? (
                          <div className="mt-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs text-zinc-400">{item.product.name}</p>
                                <p className="text-lg font-bold text-zinc-900">₹{item.product.price}</p>
                              </div>
                              {item.product.category && <span className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-500">{item.product.category}</span>}
                            </div>
                            <div className="mt-3">
                              {cartItem ? (
                                <div className="flex h-11 items-center justify-between rounded-xl bg-emerald-600 text-white">
                                  <button onClick={() => decreaseQuantity(item.product!.id)} className="flex h-full w-10 items-center justify-center rounded-l-xl transition hover:bg-emerald-700"><Minus className="h-4 w-4" /></button>
                                  <span className="text-sm font-bold">{cartItem.quantity}</span>
                                  <button onClick={() => increaseQuantity(item.product!.id)} className="flex h-full w-10 items-center justify-center rounded-r-xl transition hover:bg-emerald-700"><Plus className="h-4 w-4" /></button>
                                </div>
                              ) : <button onClick={() => { addToCart(item.product!); toast.success(`${item.product!.name} added to cart`); }} className="flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white transition hover:bg-zinc-700">Add to Cart</button>}
                            </div>
                          </div>
                        ) : <p className="mt-4 text-xs font-medium text-red-400">Not available currently</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Bottom CTA */}
            {availableCount > 0 && (
              <div className="flex flex-col items-center gap-3 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 text-center">
                <p className="text-sm text-zinc-500">
                  {availableCount} of {results.length} items added to your shopping list
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={addAllToCart}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Add All to Cart
                  </button>
                  <Link
                    href="/cart"
                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 font-semibold text-zinc-700 transition hover:bg-zinc-50 hover:shadow-sm"
                  >
                    View Cart
                  </Link>
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
