import { useCart } from "@/store/cart";

type ProductLike = {
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

  const handleAddClick = () => {
    if (onAddToCart) {
      onAddToCart();
      return;
    }

    addToCart(product);
  };

  return (
    <div className="relative rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className={`mb-3 flex h-8 items-center rounded-full border px-2 transition ${
          isAdded
            ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40"
            : "border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
        }`}
        aria-live="polite"
      >
        <span className="inline-flex w-10 rounded-full bg-white/80 p-1 dark:bg-zinc-900/80">
          <span
            className={`h-3 w-3 rounded-full transition-transform ${
              isAdded ? "translate-x-5 bg-emerald-600" : "translate-x-0 bg-zinc-400"
            }`}
          />
        </span>
        <span
          className={`ml-2 text-xs font-semibold ${
            isAdded ? "text-emerald-700 dark:text-emerald-300" : "text-zinc-600 dark:text-zinc-300"
          }`}
        >
          {isAdded ? "Added to cart" : "Not in cart"}
        </span>
      </div>

      <img src={imageSrc} alt={product.name} className="h-32 w-full object-cover" />

      {product.category ? (
        <p className="mt-3 inline-block rounded-full bg-zinc-100 px-2 py-1 text-xs font-semibold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {product.category}
        </p>
      ) : null}

      <h3>{product.name}</h3>
      <p>₹{product.price}</p>

      <button
        type="button"
        onClick={handleAddClick}
        className="mt-2 cursor-pointer rounded bg-green-600 px-3 py-1 text-white"
      >
        {actionLabel}
      </button>
    </div>
  );
}
