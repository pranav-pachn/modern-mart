import { useCart } from "@/store/cart";
import Link from "next/link";

type ProductLike = {
  _id?: string;
  id?: string;
  name: string;
  price: number;
  category?: string;
  image?: string;
};

type ProductCardProps = {
  product: ProductLike;
  onAddToCart?: () => void;
  actionLabel?: string;
};

function resolveImageSrc(image?: string): string {
  if (!image) {
    return "/products/placeholder.svg";
  }

  // Keep fully qualified remote/data URLs, but avoid broken local filename paths.
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) {
    return image;
  }

  return "/products/placeholder.svg";
}

export default function ProductCard({
  product,
  onAddToCart,
  actionLabel = "Add to Cart",
}: ProductCardProps) {
  const { addToCart } = useCart();
  const imageSrc = resolveImageSrc(product.image);
  const isAdded = actionLabel.toLowerCase() === "added";
  
  const productId = product._id || product.id || "";

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    addToCart(product as any);
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg">
      <Link href={productId ? `/product/${productId}` : "#"} className="aspect-square w-full overflow-hidden bg-gray-50 relative block">
        <img src={imageSrc} alt={product.name} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          {product.category && (
            <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-emerald-600">
              {product.category}
            </span>
          )}
          <Link href={productId ? `/product/${productId}` : "#"}>
            <h3 className="line-clamp-2 font-bold text-gray-900 text-base leading-tight hover:text-emerald-600 transition">
              {product.name}
            </h3>
          </Link>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3">
          <p className="text-lg font-black text-gray-900">₹{product.price}</p>
          <button
            type="button"
            onClick={handleAddClick}
            className={`flex items-center justify-center rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              isAdded
                ? "bg-emerald-50 text-emerald-700 pointer-events-none"
                : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
            }`}
          >
            {isAdded ? "Added ✓" : "Add"}
          </button>
        </div>
      </div>
    </div>
  );
}
