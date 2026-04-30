"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getAiHistory, AIHistoryItem } from "@/lib/ai-history";
import Link from "next/link";
import { useCart } from "@/store/cart";
import { ArrowLeft, Clock, History, Plus, CheckCircle2, ShoppingBag, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AiHistorySkeleton } from "@/components/Skeletons";
import toast from "react-hot-toast";

export default function AIHistoryPage() {
  const { data: session, status } = useSession();
  const [history, setHistory] = useState<AIHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const { addToCart, cart } = useCart();

  useEffect(() => {
    if (status === "loading") return;
    getAiHistory(session).then((data) => {
      setHistory(data);
      setIsLoading(false);
    });
  }, [session, status]);

  const toggleExpand = (id: string | number) => {
    setExpandedItems((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-4" />
            <div className="flex gap-3 mb-2">
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
          </div>
          <AiHistorySkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link
              href="/ai"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Generator
            </Link>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight text-zinc-900">
              <History className="h-8 w-8 text-emerald-600" />
              AI Grocery History
            </h1>
            <p className="mt-2 text-zinc-500">
              Your previously generated lists and recipes.{" "}
              {!session?.user && (
                <span className="text-amber-600">
                  You are viewing local history. Log in to save across devices.
                </span>
              )}
            </p>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white py-20 text-center">
            <Clock className="mb-4 h-12 w-12 text-zinc-300" />
            <h3 className="text-lg font-bold text-zinc-900">No history yet</h3>
            <p className="mt-1 text-sm text-zinc-500">
              Generate some grocery lists using the AI tool to see them here.
            </p>
            <Link
              href="/ai"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Start Generating
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {history.map((entry, idx) => {
              const itemId = entry.id || idx;
              const isExpanded = !!expandedItems[itemId];

              return (
                <Card key={itemId} className="overflow-hidden">
                  <CardHeader className="border-b border-zinc-100 bg-zinc-50/50 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <CardTitle className="text-lg text-zinc-900">"{entry.prompt}"</CardTitle>
                        <p className="mt-1 text-xs text-zinc-500">
                          {new Date(entry.createdAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            const allItems = [
                              ...entry.results.filter(r => r.product),
                              ...entry.suggestedResults.filter(r => r.product),
                            ];
                            allItems.forEach((r) => r.product && addToCart(r.product));
                            if (allItems.length > 0) {
                              toast.success(`${allItems.length} item${allItems.length > 1 ? "s" : ""} added to cart!`);
                            }
                          }}
                          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                        >
                          <ShoppingBag className="h-4 w-4" />
                          Add All
                        </button>
                        <button
                          onClick={() => toggleExpand(itemId)}
                          className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900"
                        >
                          {isExpanded ? (
                            <>
                              Hide List <ChevronUp className="h-4 w-4" />
                            </>
                          ) : (
                            <>
                              View List <ChevronDown className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  {isExpanded && (
                    <CardContent className="pt-6 bg-white">
                      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                        {/* Main Items */}
                        {entry.results.map((item, i) => {
                          const inCart = item.product ? cart.some((c) => c.id === item.product!.id) : false;
                          return (
                            <div key={i} className="flex items-center justify-between rounded-xl border border-zinc-100 bg-zinc-50/50 p-3 shadow-sm hover:border-zinc-200 transition-colors">
                              <div>
                                <p className="font-medium capitalize text-zinc-900 line-clamp-1" title={item.item}>{item.item}</p>
                                <p className="text-xs text-zinc-500">{item.qty}</p>
                              </div>
                              {item.product ? (
                                <button
                                  onClick={() => addToCart(item.product!)}
                                  disabled={inCart}
                                  className={`rounded-lg p-2 transition-colors ${
                                    inCart ? "bg-emerald-100 text-emerald-600" : "bg-white border text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 shadow-sm"
                                  }`}
                                >
                                  {inCart ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </button>
                              ) : (
                                <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">Unavailable</span>
                              )}
                            </div>
                          );
                        })}
                        
                        {/* Suggested Items */}
                        {entry.suggestedResults?.map((item, i) => {
                          const inCart = item.product ? cart.some((c) => c.id === item.product!.id) : false;
                          return (
                            <div key={`sugg-${i}`} className="flex items-center justify-between rounded-xl border border-dashed border-zinc-200 bg-white p-3 hover:border-zinc-300 transition-colors">
                              <div>
                                <p className="font-medium capitalize text-zinc-900 line-clamp-1" title={item.item}>{item.item}</p>
                                <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-semibold mt-0.5">Suggested</p>
                              </div>
                              {item.product ? (
                                <button
                                  onClick={() => addToCart(item.product!)}
                                  disabled={inCart}
                                  className={`rounded-lg p-2 transition-colors ${
                                    inCart ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                  }`}
                                >
                                  {inCart ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </button>
                              ) : (
                                <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-100 px-2 py-1 rounded-md">Unavailable</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
