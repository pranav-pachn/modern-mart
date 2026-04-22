"use client";

import { useEffect, useRef, useState } from "react";
import { adminFetch } from "@/lib/admin-fetch";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Pencil, Trash2, X, Check, ToggleLeft, ToggleRight, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

// ── Helpers ────────────────────────────────────────────────────────────────────

async function patchProduct(id: string, fields: Record<string, unknown>) {
  return adminFetch(`/api/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(fields),
    headers: { "Content-Type": "application/json" },
  });
}

// ── Inline Price Cell ──────────────────────────────────────────────────────────
function InlinePrice({ product, onChange }: { product: any; onChange: (p: any) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(product.price));
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => { setEditing(true); setTimeout(() => inputRef.current?.select(), 0); };
  const cancel = () => { setValue(String(product.price)); setEditing(false); };

  const save = async () => {
    const num = Number(value);
    if (isNaN(num) || num < 0) { cancel(); return; }
    const res = await patchProduct(product._id, {
      name: product.name, price: num, category: product.category,
      image: product.image, stock: product.stock,
    });
    if (res.ok) { onChange({ ...product, price: num }); setEditing(false); }
    else { alert("Failed to update price."); cancel(); }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-gray-500 text-sm">₹</span>
        <input
          ref={inputRef}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="w-20 px-2 py-1 text-sm border border-emerald-400 rounded-md outline-none ring-2 ring-emerald-50"
          min="0"
          step="0.01"
        />
        <button onClick={save} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"><Check className="w-3.5 h-3.5" /></button>
        <button onClick={cancel} className="p-1 text-gray-400 hover:bg-gray-100 rounded"><X className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <button
      onClick={open}
      title="Tap to edit price"
      className="group flex items-center gap-1 text-emerald-600 font-bold hover:underline underline-offset-2"
    >
      ₹{product.price}
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  );
}

// ── Out‑of‑Stock Toggle ────────────────────────────────────────────────────────
function StockToggle({ product, onChange }: { product: any; onChange: (p: any) => void }) {
  const [busy, setBusy] = useState(false);
  const inStock = Number(product.stock) > 0;

  const toggle = async () => {
    setBusy(true);
    const newStock = inStock ? 0 : 10; // restore sensible default when turning back on
    const res = await patchProduct(product._id, {
      name: product.name, price: product.price, category: product.category,
      image: product.image, stock: newStock,
    });
    if (res.ok) onChange({ ...product, stock: newStock });
    else alert("Could not update stock.");
    setBusy(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={inStock ? "Mark as Out of Stock" : "Mark as In Stock"}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        inStock
          ? "bg-emerald-50 text-emerald-700 hover:bg-red-50 hover:text-red-600"
          : "bg-red-50 text-red-600 hover:bg-emerald-50 hover:text-emerald-700"
      } ${busy ? "opacity-50 pointer-events-none" : ""}`}
    >
      {inStock
        ? <><ToggleRight className="w-4 h-4" /> In Stock</>
        : <><ToggleLeft className="w-4 h-4" /> Out of Stock</>
      }
    </button>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 12;

  const update = (updated: any) =>
    setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));

  const loadPage = async (p: number) => {
    try {
      setIsLoading(true);
      setLoadError(false);
      const res = await adminFetch(`/api/products?page=${p}&limit=${LIMIT}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      if (Array.isArray(data)) {
        setProducts(data);
        setTotalPages(1);
      } else {
        setProducts(data.products ?? []);
        setTotalPages(data.totalPages ?? 1);
      }
      setPage(p);
    } catch {
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadPage(1); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product permanently?")) return;
    const res = await adminFetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) setProducts((p) => p.filter((x) => x._id !== id));
    else alert("Failed to delete.");
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <p className="text-sm text-gray-500 mt-1">
          Tap a price to edit it inline · Toggle stock status with one tap
        </p>
      </div>

      {/* ── Product Cards (mobile-first grid) ── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-14 h-14 rounded-xl bg-gray-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 rounded-full bg-gray-100" />
                  <div className="h-3 w-1/2 rounded-full bg-gray-100" />
                </div>
              </div>
              <div className="h-10 rounded-lg bg-gray-50 mb-3" />
              <div className="flex gap-2">
                <div className="flex-1 h-9 rounded-xl bg-gray-100" />
                <div className="flex-1 h-9 rounded-xl bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-16 px-6 text-center">
          <span className="text-4xl mb-3">⚠️</span>
          <h3 className="text-base font-bold text-red-700 mb-1">Failed to load products</h3>
          <p className="text-sm text-red-500 mb-4">Check your backend connection and try again.</p>
          <button
            onClick={() => loadPage(1)}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition"
          >
            Retry
          </button>
        </div>
      ) : products.length === 0 ? (
        <Card className="shadow-none border border-gray-200">
          <CardContent className="py-16 text-center text-gray-400 text-sm">
            No products found. Add your first product →
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const inStock = Number(p.stock) > 0;
            return (
              <Card
                key={p._id}
                className={`shadow-none border transition-colors ${
                  inStock ? "border-gray-200" : "border-red-100 bg-red-50/30"
                }`}
              >
                <CardContent className="p-4">
                  {/* Top row: image + name */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-14 h-14 shrink-0 rounded-xl border border-gray-100 bg-gray-50 overflow-hidden flex items-center justify-center">
                      {p.image
                        ? <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        : <span className="text-2xl">📦</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate">{p.name}</p>
                      <Badge variant="secondary" className="text-[10px] capitalize mt-0.5">
                        {p.category}
                      </Badge>
                    </div>
                  </div>

                  {/* Price (inline editable) */}
                  <div className="flex items-center justify-between mb-3 py-2 border-t border-b border-gray-100">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</span>
                    <InlinePrice product={p} onChange={update} />
                  </div>

                  {/* Stock status toggle */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs text-gray-500">
                      {inStock
                        ? <span className="font-medium text-gray-700">{p.stock} units left</span>
                        : <span className="font-semibold text-red-500">Out of stock</span>
                      }
                    </div>
                    <StockToggle product={p} onChange={update} />
                  </div>

                  {/* Action buttons — big & touch-friendly */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/edit-product/${p._id}`}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-blue-50 text-blue-600 text-sm font-semibold rounded-xl hover:bg-blue-100 transition-colors active:scale-95"
                    >
                      <Pencil className="w-4 h-4" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(p._id)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 transition-colors active:scale-95"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => loadPage(page - 1)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => loadPage(page + 1)}
              className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
