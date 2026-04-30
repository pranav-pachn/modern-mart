"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Upload, Check, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { adminFetch } from "@/lib/admin-fetch";

const CATEGORIES = ["Vegetables", "Fruits", "Dairy", "Beverages", "Snacks", "Bakery", "Household", "Staples", "Other"];

export default function AdminEditProduct() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", price: "", category: "", image: "", stock: "", description: "", unit: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setForm({
          name: data.name || "",
          price: data.price || "",
          category: data.category || "",
          image: data.image || "",
          stock: data.stock !== undefined ? String(data.stock) : "",
          description: data.description || "",
          unit: data.unit || "",
        });
        if (data.image) setPreview(data.image);
      } catch (err) {
        console.error(err);
        alert("Failed to load product");
        router.push("/admin/products");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id, router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setForm((f) => ({ ...f, image: result }));
      setPreview(result);
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image) { alert("Please upload a product image."); return; }
    setIsProcessing(true);

    const res = await adminFetch(`/api/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, price: Number(form.price), stock: Number(form.stock) }),
    });

    if (res.ok) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        router.push("/admin/products");
      }, 1000);
    } else {
      alert("Failed to edit product. Please check all fields and try again.");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/products" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-1">Update inventory item details.</p>
        </div>
      </div>

      <div className="max-w-xl">
        <Card className="shadow-none border border-gray-200">
          <CardHeader className="border-b border-gray-100 pb-4">
            <CardTitle className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Product Details
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
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Product Name</label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                  placeholder="e.g., Fresh Tomatoes"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              {/* Price + Stock */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                    placeholder="e.g., 40"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
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
                    onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Category</label>
                <select
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 bg-white transition-all"
                  value={form.category.toLowerCase()}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                >
                  <option value="" disabled>Select a category…</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c.toLowerCase()}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Unit</label>
                <input
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                  placeholder="e.g., 1 kg, 500g, 1 piece"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Description</label>
                <textarea
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all min-h-[100px]"
                  placeholder="Product description..."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold rounded-lg transition-colors mt-2"
              >
                {success
                  ? <><Check className="w-4 h-4" /> Saved!</>
                  : isProcessing
                    ? "Please wait…"
                    : "Save Changes"
                }
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
