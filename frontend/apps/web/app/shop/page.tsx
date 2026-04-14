"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/store/cart";

type Product = {
  _id: string;
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  rating: number;
  image?: string;
  stock?: number;
};

type ApiProduct = {
  _id?: string;
  name?: string;
  category?: string;
  unit?: string;
  price?: number;
  rating?: number;
  image?: string;
  stock?: number;
};

function normalizeProduct(product: ApiProduct): Product | null {
  if (!product._id || !product.name || !product.category || typeof product.price !== "number") {
    return null;
  }

  return {
    _id: product._id,
    id: product._id,
    name: product.name,
    category: product.category,
    unit: product.unit ?? "1 item",
    price: product.price,
    rating: product.rating ?? 4.5,
    image: product.image,
    stock: product.stock,
  };
}

function sortProducts(data: Product[], sort: string): Product[] {
  const cloned = [...data];

  if (sort === "price_asc") {
    return cloned.sort((a, b) => a.price - b.price);
  }

  if (sort === "price_desc") {
    return cloned.sort((a, b) => b.price - a.price);
  }

  if (sort === "rating") {
    return cloned.sort((a, b) => b.rating - a.rating);
  }

  return cloned;
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopContent />
    </Suspense>
  );
}

function ShopFallback() {
  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-10 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-7xl rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        Loading shop...
      </div>
    </main>
  );
}

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToCart = useCart((state) => state.addToCart);

  const searchQuery = (searchParams.get("q") ?? "").trim();
  const selectedCategory = (searchParams.get("category") ?? "All").trim();
  const selectedSort = (searchParams.get("sort") ?? "").trim();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchInput, setSearchInput] = useState(searchQuery);
  const [categoryInput, setCategoryInput] = useState(selectedCategory || "All");
  const [sortInput, setSortInput] = useState(selectedSort);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const res = await fetch("/api/products");

        if (!res.ok) {
          throw new Error("Products request failed");
        }

        const data = (await res.json()) as ApiProduct[];
        setProducts(data.map(normalizeProduct).filter((product): product is Product => product !== null));
      } catch {
        setErrorMessage("We could not load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(products.map((product) => product.category)))],
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      sortProducts(
        products.filter((product) => {
          const matchesSearch = searchQuery
            ? `${product.name} ${product.category}`.toLowerCase().includes(searchQuery.toLowerCase())
            : true;

          const matchesCategory =
            selectedCategory === "All" || selectedCategory === ""
              ? true
              : product.category === selectedCategory;

          return matchesSearch && matchesCategory;
        }),
        selectedSort,
      ),
    [products, searchQuery, selectedCategory, selectedSort],
  );

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();

    if (searchInput.trim()) {
      params.set("q", searchInput.trim());
    }

    if (categoryInput && categoryInput !== "All") {
      params.set("category", categoryInput);
    }

    if (sortInput) {
      params.set("sort", sortInput);
    }

    const queryString = params.toString();
    router.push(queryString ? `/shop?${queryString}` : "/shop");
  };

  const resetFilters = () => {
    setSearchInput("");
    setCategoryInput("All");
    setSortInput("");
    router.push("/shop");
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedProductId(product.id);
    window.setTimeout(() => setAddedProductId(null), 1200);
  };

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 sm:py-10 dark:bg-zinc-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-emerald-700">
                Panchavati Mart
              </p>
              <h1 className="mt-1 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                Shop Page
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-300">
                Discover fresh groceries and daily essentials at great prices.
              </p>
            </div>
            <a
              href="/cart"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-5 text-sm font-semibold text-white transition hover:bg-zinc-700"
            >
              Go to cart
            </a>
          </div>
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Filters (optional)
          </h2>

          <form onSubmit={applyFilters} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="q" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Search
              </label>
              <input
                id="q"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                type="text"
                placeholder="Search products"
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Category
              </label>
              <select
                id="category"
                value={categoryInput}
                onChange={(event) => setCategoryInput(event.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Sort
              </label>
              <select
                id="sort"
                value={sortInput}
                onChange={(event) => setSortInput(event.target.value)}
                className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-3 text-zinc-900 outline-none ring-emerald-500 transition focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
              >
                <option value="">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Apply filters
              </button>
              <a
                href="/shop"
                onClick={(event) => {
                  event.preventDefault();
                  resetFilters();
                }}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 px-5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Reset
              </a>
            </div>
          </form>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Product grid</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {filteredProducts.length} item{filteredProducts.length === 1 ? "" : "s"} found
            </p>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              Loading products...
            </div>
          ) : errorMessage ? (
            <div className="rounded-2xl border border-dashed border-red-300 bg-white p-8 text-center text-red-600 dark:border-red-900 dark:bg-zinc-900">
              {errorMessage}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              No matching products. Try changing your filters.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  onAddToCart={() => handleAddToCart(product)}
                  actionLabel={addedProductId === product.id ? "Added" : "Add to Cart"}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
