"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Package, Upload, Check, Zap, SlidersHorizontal } from "lucide-react";

import { adminFetch } from "@/lib/admin-fetch";
const CATEGORIES = ["Vegetables", "Fruits", "Dairy", "Beverages", "Snacks", "Bakery", "Household", "Staples", "Other"];

const DEFAULT_PRODUCT_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9VEu0hQAAAAASUVORK5CYII=";

export default function AdminAddProduct() {
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "vegetables",
    image: "",
    stock: "10",
    description: "",
    unit: "1 unit",
  });
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [quickMode] = useState(true); // Always quick mode for simplicity
  const [lastSaveSeconds, setLastSaveSeconds] = useState<number | null>(null);
  const [entryStartedAt, setEntryStartedAt] = useState<number | null>(null);

  const setField = (key: "name" | "price" | "category" | "image" | "stock" | "description" | "unit", value: string) => {
    if (!entryStartedAt) {
      setEntryStartedAt(Date.now());
    }
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setField("image", result);
      setPreview(result);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const startedAt = entryStartedAt ?? Date.now();
    setIsSaving(true);

    const payload = {
      ...form,
      image: form.image || DEFAULT_PRODUCT_IMAGE,
      price: Number(form.price),
      stock: Number(form.stock),
    };

    const res = await adminFetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setSuccess(true);
      setLastSaveSeconds(Number(((Date.now() - startedAt) / 1000).toFixed(1)));
      setForm({ name: "", price: "", category: "vegetables", image: "", stock: "10", description: "", unit: "1 unit" });
      setEntryStartedAt(null);
      setPreview(null);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert("Failed to add product. Please check all fields and try again.");
    }

    setIsSaving(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Product</h1>
        <p className="text-sm text-gray-500 mt-1">Quick mode is optimized to add a product in under 30 seconds.</p>
      </div>

      <div className="max-w-xl">
        <Card className="shadow-none border border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              New Product Details
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Simplified Image - auto default */}
              <input
                type="hidden"
                value={form.image || DEFAULT_PRODUCT_IMAGE}
                onChange={(e) => setField("image", e.target.value)}
              />

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Product Name</label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                  placeholder="e.g., Fresh Tomatoes"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  required
                />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                    placeholder="e.g., 40"
                    value={form.price}
                    onChange={(e) => setField("price", e.target.value)}
                    required
                  />
                </div>
              {/* Hidden Stock - auto set to 10 */}
              <input
                type="hidden"
                value="10"
                onChange={(e) => setField("stock", e.target.value)}
              />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Category</label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 bg-white transition-all"
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value)}
                  required
                >
                  <option value="" disabled>Select a category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c.toLowerCase()}>{c}</option>
                  ))}
                </select>
              </div>

              
              {/* Submit */}
              <button
                type="submit"
                disabled={isProcessing || isSaving}
                className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors mt-2"
              >
                {success
                  ? <><Check className="w-4 h-4" /> Product Added!</>
                  : isProcessing || isSaving
                    ? "Please wait…"
                    : "Save Product"
                }
              </button>

            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
