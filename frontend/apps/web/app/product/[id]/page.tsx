"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronRight, Loader2, Minus, Plus, ShoppingBag, XCircle } from "lucide-react";
import { useCart } from "@/store/cart";

type ProductDetails = {
  _id: string;
  name: string;
  category: string;
  price: number;
  image?: string;
  stock?: number;
  description?: string;
  unit?: string;
};

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error("Failed to load product");
        }
        const data = await res.json();
        setProduct(data);
      } catch (e: any) {
        setError(e.message || "Could not load the product details.");
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchProduct();
  }, [id]);

  const cartItem = product ? cart.find((c) => c.id === product._id) : undefined;
  
  // Accept fully qualified remote URLs, data URLs, blob URLs, AND local /products/ paths
  const imageSrc = product?.image && /^(https?:\/\/|data:|blob:|\/)/.test(product.image)
    ? product.image
    : "/products/placeholder.svg";

  if (isLoading) {
    return (
      <main className="lp-root bg-white min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-emerald-600">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="font-semibold">Loading product details...</p>
        </div>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="lp-root bg-white min-h-screen py-20 px-6">
        <div className="lp-section-inner flex flex-col items-center text-center">
          <div className="h-20 w-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
            <XCircle className="h-10 w-10" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
          <p className="text-gray-500 mb-8">{error || "The product you're looking for doesn't exist."}</p>
          <Link href="/shop" className="lp-cta-btn">Back to Shop</Link>
        </div>
      </main>
    );
  }

  const isOutOfStock = product.stock !== undefined && product.stock <= 0;
  const quantityInCart = cartItem?.quantity || 0;
  const maxReached = product.stock !== undefined && quantityInCart >= product.stock;

  const handleAddToCart = () => {
    if (!product || isOutOfStock) return;
    const cartProduct = {
      id: product._id,
      name: product.name,
      category: product.category,
      unit: product.unit ?? "1 item",
      price: product.price,
      rating: 4.5,
      image: product.image,
      stock: product.stock,
    };
    addToCart(cartProduct);
  };

  return (
    <main className="lp-root bg-white min-h-screen pb-24">
      {/* Breadcrumb nav */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="lp-section-inner py-4">
          <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
            <Link href="/" className="hover:text-emerald-600 transition">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/shop" className="hover:text-emerald-600 transition">Shop</Link>
            <ChevronRight className="h-4 w-4" />
            <Link href={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-emerald-600 transition">
              {product.category}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 line-clamp-1">{product.name}</span>
          </nav>
        </div>
      </div>

      <div className="lp-section-inner mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Product Image */}
        <div className="relative aspect-square w-full rounded-3xl bg-gray-50 border border-gray-100 p-8 flex items-center justify-center overflow-hidden">
          <img 
            src={imageSrc} 
            alt={product.name}
            className="w-full h-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" 
          />
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <span className="text-emerald-600 font-bold uppercase tracking-wider text-sm mb-3 block">
            {product.category}
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 leading-tight mb-4">
            {product.name}
          </h1>
          
          <div className="flex items-end gap-3 mb-6">
            <p className="text-4xl font-extrabold text-gray-900">₹{product.price}</p>
            {product.unit && <p className="text-gray-500 font-semibold mb-1">/ {product.unit}</p>}
          </div>

          {/* Stock Badges */}
          <div className="mb-8">
            {isOutOfStock ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                <XCircle className="h-4 w-4" /> Out of stock
              </span>
            ) : product.stock !== undefined && product.stock < 10 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-sm font-bold text-orange-600">
                ⚠️ Only {product.stock} left in stock
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600">
                <CheckCircle2 className="h-4 w-4" /> In stock
              </span>
            )}
          </div>

          <div className="h-px w-full bg-gray-200 mb-8" />
          
          <h3 className="font-bold text-gray-900 text-lg mb-2">Description</h3>
          <p className="text-gray-600 leading-relaxed mb-8">
            {product.description || `Fresh, high-quality ${product.name.toLowerCase()} sourced locally. Perfect for your daily needs and selected with care by Panchavati Mart to ensure the best standard for your family.`}
          </p>

          {/* Actions */}
          <div className="mt-auto pt-4 flex flex-col sm:flex-row gap-4">
            {isOutOfStock ? (
              <button disabled className="lp-cta-btn bg-gray-300 text-white cursor-not-allowed hover:translate-y-0 shadow-none border-transparent w-full sm:w-auto flex-1 justify-center">
                Out of Stock
              </button>
            ) : cartItem ? (
              <div className="flex items-center justify-between rounded-xl border-2 border-emerald-600 bg-white h-14 overflow-hidden w-full sm:w-48">
                <button
                  onClick={() => decreaseQuantity(product._id)}
                  className="flex h-full w-14 items-center justify-center transition hover:bg-emerald-50 text-emerald-700"
                >
                  <Minus className="h-5 w-5" />
                </button>
                <div className="flex flex-col items-center justify-center flex-1">
                   <span className="text-lg font-black text-gray-900">{cartItem.quantity}</span>
                   {maxReached && <span className="text-[10px] text-orange-600 font-bold leading-none -mt-1">MAX</span>}
                </div>
                <button
                  onClick={() => {
                    if (!maxReached) increaseQuantity(product._id);
                  }}
                  disabled={maxReached}
                  className={`flex h-full w-14 items-center justify-center transition ${maxReached ? "text-gray-300 bg-gray-50 cursor-not-allowed" : "hover:bg-emerald-50 text-emerald-700"}`}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="lp-cta-btn flex-1 justify-center flex items-center gap-2 h-14"
              >
                <ShoppingBag className="h-5 w-5" />
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
