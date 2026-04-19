"use client";

import { FormEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeletons";
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
    <main className="lp-root bg-white pb-20 pt-8">
      <div className="lp-section-inner flex flex-col gap-10">
        <section className="flex flex-col gap-2">
          <div className="h-3 w-28 animate-pulse rounded-full bg-gray-100" />
          <div className="h-10 w-72 animate-pulse rounded-xl bg-gray-100" />
          <div className="h-4 w-96 animate-pulse rounded-full bg-gray-100" />
        </section>
        <ProductGridSkeleton count={8} />
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
  const pageParam = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  const [products, setProducts] = useState<Product[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

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

        const params = new URLSearchParams();
        params.set("page", pageParam.toString());
        params.set("limit", "12");
        if (searchQuery) params.set("q", searchQuery);
        if (selectedCategory && selectedCategory !== "All") params.set("category", selectedCategory);
        if (selectedSort) params.set("sort", selectedSort);

        const res = await fetch(`/api/products?${params.toString()}`);

        if (!res.ok) {
          throw new Error("Products request failed");
        }

        const responseData = await res.json();
        const data = Array.isArray(responseData) ? responseData : (responseData.products ?? []);
        setProducts(data.map(normalizeProduct).filter((p: Product | null): p is Product => p !== null));
        
        if (responseData.total !== undefined) {
          setTotalItems(responseData.total);
          setTotalPages(responseData.totalPages || 1);
        } else {
          setTotalItems(data.length);
          setTotalPages(1);
        }
      } catch {
        setErrorMessage("We could not load products. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [searchQuery, selectedCategory, selectedSort, pageParam]);

  const categories = ["All", "Vegetables", "Fruits", "Dairy", "Bakery", "Snacks", "Beverages", "Spices", "Grains", "Oils"];

  const applyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (searchInput.trim()) params.set("q", searchInput.trim());
    if (categoryInput && categoryInput !== "All") params.set("category", categoryInput);
    if (sortInput) params.set("sort", sortInput);
    params.set("page", "1"); // Reset to page 1 on new filter

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
    <main className="lp-root bg-white pb-20 pt-8">
      <div className="lp-section-inner flex flex-col gap-10">
        
        {/* Header Section */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="lp-section-label">Panchavati Mart</p>
            <h1 className="lp-section-title" style={{ marginBottom: "12px", fontSize: "clamp(28px, 4vw, 42px)" }}>
              Shop Fresh Groceries
            </h1>
            <p className="lp-subtitle">
              Discover fresh produce and daily essentials delivered to your door.
            </p>
          </div>
          <a href="/cart" className="lp-cta-btn">
            Go to Cart →
          </a>
        </section>

        {/* Filters Section */}
        <section className="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-gray-900">
            Filter & Search
          </h2>
          <form onSubmit={applyFilters} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2">
              <label htmlFor="q" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Search
              </label>
              <input
                id="q"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                type="text"
                placeholder="Search products..."
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2"
              />
            </div>

            <div>
              <label htmlFor="category" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Category
              </label>
              <select
                id="category"
                value={categoryInput}
                onChange={(event) => setCategoryInput(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2 appearance-none"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="sort" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Sort
              </label>
              <select
                id="sort"
                value={sortInput}
                onChange={(event) => setSortInput(event.target.value)}
                className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none ring-emerald-500 transition focus:border-emerald-500 focus:ring-2 appearance-none"
              >
                <option value="">Recommended</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>

            <div className="flex gap-3 sm:col-span-2 lg:col-span-4 mt-2">
              <button
                type="submit"
                className="inline-flex h-11 flex-1 sm:flex-none items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm"
              >
                Apply Filters
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 flex-1 sm:flex-none items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* Product Grid Section */}
        <section>
          <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
            <h2 className="text-xl font-bold text-gray-900">All Products</h2>
            <p className="text-sm font-semibold text-gray-500">
              {totalItems} item{totalItems === 1 ? "" : "s"} found
            </p>
          </div>

          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : errorMessage ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-24 text-red-600 font-medium font-bold">
              {errorMessage}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 px-6 text-center">
              <span className="text-6xl mb-5" aria-hidden="true">🔍</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 text-sm max-w-xs mb-6">
                We couldn't find any products matching your search or filter. Try adjusting your criteria.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    actionLabel={addedProductId === product.id ? "Added" : "Add to Cart"}
                  />
                ))}
              </div>

              {/* Pagination Section */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("page", String(Math.max(1, pageParam - 1)));
                      router.push(`/shop?${params.toString()}`);
                    }}
                    disabled={pageParam === 1 || isLoading}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    &lt;
                  </button>
                  <span className="px-2 text-sm font-bold text-gray-600">
                    Page {pageParam} of {totalPages}
                  </span>
                  <button
                    onClick={() => {
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("page", String(Math.min(totalPages, pageParam + 1)));
                      router.push(`/shop?${params.toString()}`);
                    }}
                    disabled={pageParam === totalPages || isLoading}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
