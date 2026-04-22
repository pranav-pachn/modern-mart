"use client";

import { useState } from "react";
import { useCart } from "@/store/cart";
import { Sparkles, ShoppingBag, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import { saveAiHistory } from "@/lib/ai-history";

export default function AIGrocery() {
  const [input, setInput] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [suggestedResults, setSuggestedResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorPrompt, setErrorPrompt] = useState("");
  const { addToCart } = useCart();
  const { data: session } = useSession();

  const generateList = async () => {
    if (!input.trim()) return;
    
    setIsLoading(true);
    setErrorPrompt("");
    setResults([]);
    setSuggestedResults([]);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: input }),
      });

      if (!res.ok) throw new Error("AI fetch failed");
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
        throw new Error("Could not understand the AI response, please try again.");
      }

      const matchRes = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [...parsedItems, ...parsedSuggested] }),
      });

      if (!matchRes.ok) {
        throw new Error("Could not match items to database.");
      }
      
      const matched = await matchRes.json();
      const finalResults = matched.slice(0, parsedItems.length);
      const finalSuggested = matched.slice(parsedItems.length);
      
      setResults(finalResults);
      setSuggestedResults(finalSuggested);

      // Save to history
      await saveAiHistory(input, finalResults, finalSuggested, session);
    } catch (e: any) {
      setErrorPrompt(e.message || "Something went wrong handling the AI list.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      generateList();
    }
  };

  return (
    <div className="flex w-full flex-col gap-6 rounded-3xl bg-white/85 p-6 shadow-xl shadow-zinc-200/50 backdrop-blur sm:p-8">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 shadow-inner">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">AI Grocery Generator</h2>
          <p className="text-sm text-zinc-500">Tell us what you're making, we'll build your shopping list.</p>
        </div>
      </div>

      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <input
          placeholder="E.g., Paneer butter masala for 4 people..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          className="h-12 flex-1 rounded-2xl border border-zinc-200 bg-white px-4 text-zinc-900 outline-none ring-emerald-400 transition focus:ring-2 disabled:opacity-50"
        />
        <button
          onClick={generateList}
          disabled={isLoading || !input.trim()}
          className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-zinc-800 disabled:pointer-events-none disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Generate List"}
        </button>
      </div>

      {errorPrompt && (
        <p className="text-sm font-medium text-red-500">{errorPrompt}</p>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-4 flex flex-col gap-4 border-t border-zinc-100 pt-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-zinc-900">Your Recommended List</h3>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              {results.length} items found
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((item, i) => (
              <div 
                key={i} 
                className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${
                  item.product 
                    ? "border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30 hover:border-emerald-200 hover:shadow-sm" 
                    : "border-zinc-200 bg-zinc-50/50"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-zinc-900 line-clamp-1" title={item.item}>
                      {item.item}
                    </p>
                    {item.product ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-zinc-400" />
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">Qty required: {item.qty}</p>
                </div>

                <div className="mt-4 flex items-end justify-between">
                  {item.product ? (
                    <>
                      <p className="font-bold text-zinc-900">₹{item.product.price}</p>
                      <button
                        onClick={() => addToCart(item.product)}
                        className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                      >
                        Add
                      </button>
                    </>
                  ) : (
                    <p className="text-xs font-medium text-red-500">Not in standard catalog</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add All */}
          <button
            onClick={() => {
              results.forEach(r => r.product && addToCart(r.product));
            }}
            className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 font-semibold text-white shadow-lg shadow-emerald-200 transition hover:-translate-y-0.5 hover:bg-emerald-700"
          >
            <ShoppingBag className="h-5 w-5" />
            Add All Available to Cart
          </button>

          {/* Suggested items */}
          {suggestedResults.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-6">
              <h3 className="mb-4 text-lg font-bold text-zinc-900">You might also need:</h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {suggestedResults.map((item, i) => (
                  <div key={`sugg-${i}`} className={`flex flex-col justify-between rounded-2xl border p-4 transition-all ${item.product ? "border-emerald-100 bg-gradient-to-b from-white to-emerald-50/30 hover:border-emerald-200 hover:shadow-sm" : "border-zinc-200 bg-zinc-50/50"}`}>
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold capitalize text-zinc-900 line-clamp-1">{item.item}</p>
                        {item.product ? <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" /> : <XCircle className="h-5 w-5 shrink-0 text-zinc-400" />}
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">Suggested</p>
                    </div>
                    <div className="mt-4 flex items-end justify-between">
                      {item.product ? (
                        <>
                          <p className="font-bold text-zinc-900">₹{item.product.price}</p>
                          <button onClick={() => addToCart(item.product)} className="rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700">Add</button>
                        </>
                      ) : <p className="text-xs font-medium text-red-500">Not in standard catalog</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
