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
  const [quickMode, setQuickMode] = useState(true);
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

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setQuickMode(true)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
            quickMode ? "bg-emerald-600 text-white" : "border border-gray-200 bg-white text-gray-600"
          }`}
        >
          <Zap className="h-3.5 w-3.5" />
          Quick Add (Target: {"< 30s"})
        </button>
        <button
          type="button"
          onClick={() => setQuickMode(false)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition ${
            !quickMode ? "bg-gray-900 text-white" : "border border-gray-200 bg-white text-gray-600"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Detailed Add
        </button>
        {lastSaveSeconds !== null ? (
          <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
            Last add: {lastSaveSeconds}s
          </span>
        ) : null}
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

              {/* Image Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">
                  Product Image
                </label>
                <label
                  htmlFor="image-upload"
                  className="relative flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors group overflow-hidden"
                >
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-7 h-7 text-gray-300 mx-auto mb-2 group-hover:text-emerald-400 transition-colors" />
                      <p className="text-sm font-medium text-gray-400 group-hover:text-emerald-500">Click to upload image</p>
                      <p className="text-xs text-gray-300 mt-1">PNG, JPG, WEBP up to 5MB</p>
                    </div>
                  )}
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </label>
                {isProcessing && <p className="text-xs text-blue-500 mt-1.5 font-medium">Processing image…</p>}
                {!preview && (
                  <button
                    type="button"
                    onClick={() => {
                      setField("image", DEFAULT_PRODUCT_IMAGE);
                      setPreview(DEFAULT_PRODUCT_IMAGE);
                    }}
                    className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Use default image (faster)
                  </button>
                )}
                {preview && (
                  <button
                    type="button"
                    onClick={() => { setPreview(null); setForm((f) => ({ ...f, image: "" })); }}
                    className="mt-2 text-xs text-red-400 hover:text-red-600 font-medium"
                  >
                    Remove image
                  </button>
                )}
              </div>

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
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Stock (qty)</label>
                  <input
                    type="number"
                    min="0"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                    placeholder="e.g., 100"
                    value={form.stock}
                    onChange={(e) => setField("stock", e.target.value)}
                    required
                  />
                </div>
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

              {/* Unit */}
              {!quickMode ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Unit</label>
                  <input
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                    placeholder="e.g., 1 kg, 500g, 1 piece"
                    value={form.unit}
                    onChange={(e) => setField("unit", e.target.value)}
                  />
                </div>
              ) : null}

              {/* Description */}
              {!quickMode ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Description</label>
                  <textarea
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all min-h-[100px]"
                    placeholder="Product description..."
                    value={form.description}
                    onChange={(e) => setField("description", e.target.value)}
                  />
                </div>
              ) : null}

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
