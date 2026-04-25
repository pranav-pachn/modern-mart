"use client";

import Link from "next/link";
import { ShoppingBag, Check, AlertTriangle, Minus, Plus } from "lucide-react";
import { useCart } from "@/store/cart";
import toast from "react-hot-toast";

export type CartProduct = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  rating: number;
  image?: string;
  stock?: number;
};

type ProductLike = {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  category?: string;
  image?: string;
  stock?: number;
  unit?: string;
  rating?: number;
};

type ProductCardProps = {
  product: ProductLike;
  onAddToCart?: () => void;
  actionLabel?: string;
};

function resolveImageSrc(image?: string): string {
  if (!image) return "/products/placeholder.svg";
  // Accept fully qualified remote URLs, data URLs, blob URLs, AND relative paths (e.g. /products/...)
  if (/^(https?:\/\/|data:|blob:|\/)/i.test(image)) return image;
  return "/products/placeholder.svg";
}

export default function ProductCard({
  product,
  onAddToCart,
  actionLabel = "Add to Cart",
}: ProductCardProps) {
  const { cart, addToCart, increaseQuantity, decreaseQuantity } = useCart();
  const imageSrc = resolveImageSrc(product.image);
  const isAdded = actionLabel.toLowerCase() === "added";
  const productId = product._id ?? product.id ?? "";
  const inStock = product.stock === undefined || product.stock > 0;
  const lowStock = product.stock !== undefined && product.stock > 0 && product.stock < 5;

  const cartItem = cart.find((c) => c.id === productId);
  const quantityInCart = cartItem?.quantity || 0;
  const maxReached = product.stock !== undefined && quantityInCart >= product.stock;

  const handleAddClick = () => {
    if (!inStock) return;
    if (onAddToCart) {
      onAddToCart();
      return;
    }
    const cartProduct: CartProduct = {
      id: productId,
      name: product.name,
      category: product.category ?? "General",
      unit: product.unit ?? "1 item",
      price: product.price,
      rating: product.rating ?? 4.5,
      image: product.image,
      stock: product.stock,
    };
    addToCart(cartProduct);
    toast.success(`${product.name} added to cart`);
  };

  return (
    <div className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
      {/* Image area — clickable → detail page */}
      <Link href={`/product/${productId}`} className="block relative aspect-square bg-gray-50 overflow-hidden">
        <img
          src={imageSrc}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500 mix-blend-multiply"
        />
        {/* Stock badge */}
        {!inStock && (
          <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-bold text-red-600">
            Out of stock
          </span>
        )}
        {lowStock && (
          <span className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-1 text-[11px] font-bold text-orange-600">
            <AlertTriangle className="h-3 w-3" /> Only {product.stock} left
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 p-4 pt-3">
        {product.category && (
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            {product.category}
          </span>
        )}
        <Link
          href={`/product/${productId}`}
          className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 hover:text-emerald-700 transition-colors"
        >
          {product.name}
        </Link>

        <div className="mt-auto pt-2 sm:pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2">
          <p className="text-base sm:text-lg font-extrabold text-gray-900">₹{product.price}</p>

          {!inStock ? (
            <button
              type="button"
              disabled
              className="flex w-full sm:w-auto h-10 sm:h-9 items-center justify-center gap-1 rounded-xl bg-gray-100 px-3 text-xs font-bold text-gray-400 cursor-not-allowed"
            >
              Add
            </button>
          ) : cartItem ? (
            <div className="flex h-10 sm:h-9 items-center justify-between rounded-xl border border-emerald-600 bg-white overflow-hidden w-full sm:w-[100px]">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (cartItem && cartItem.quantity <= 1) {
                    toast("Removed from cart", { icon: "🗑️" });
                  }
                  decreaseQuantity(productId);
                }}
                className="flex h-full w-10 sm:w-8 items-center justify-center transition hover:bg-emerald-50 text-emerald-700"
              >
                <Minus className="h-3 w-3" />
              </button>
              <div className="flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-gray-900">{cartItem.quantity}</span>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  if (!maxReached) increaseQuantity(productId);
                }}
                disabled={maxReached}
                className={`flex h-full w-10 sm:w-8 items-center justify-center transition ${
                  maxReached ? "text-gray-300 bg-gray-50 cursor-not-allowed" : "hover:bg-emerald-50 text-emerald-700"
                }`}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleAddClick}
              className={`flex w-full sm:w-auto h-10 sm:h-9 items-center justify-center gap-1.5 rounded-xl px-4 text-xs font-bold transition-all duration-200 ${
                isAdded
                  ? "bg-emerald-500 text-white scale-95"
                  : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 shadow-sm"
              }`}
            >
              {isAdded ? (
                <><Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="sm:inline">Added</span></>
              ) : (
                <><ShoppingBag className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> <span className="sm:inline">Add</span></>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
