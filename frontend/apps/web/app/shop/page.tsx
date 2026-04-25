"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, SlidersHorizontal, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { ProductGridSkeleton } from "@/components/Skeletons";
import { useCart } from "@/store/cart";

// ─── Types ────────────────────────────────────────────────────────────────────

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

const SORT_OPTIONS = [
  { value: "", label: "Recommended" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

// ─── Page shell ───────────────────────────────────────────────────────────────

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
        <div className="h-10 w-72 animate-pulse rounded-xl bg-gray-100" />
        <ProductGridSkeleton count={8} />
      </div>
    </main>
  );
}

// ─── Main content ─────────────────────────────────────────────────────────────

function ShopContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const addToCart = useCart((state) => state.addToCart);

  // URL-driven state (source of truth for fetch)
  const searchQuery    = (searchParams.get("q") ?? "").trim();
  const selectedCat    = (searchParams.get("category") ?? "All").trim();
  const selectedSort   = (searchParams.get("sort") ?? "").trim();
  const pageParam      = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  // Local UI state
  const [searchInput, setSearchInput]     = useState(searchQuery);
  const [activeCategory, setActiveCategory] = useState(selectedCat || "All");
  const [activeSort, setActiveSort]       = useState(selectedSort);
  const [showFilters, setShowFilters]     = useState(false);

  const [products, setProducts]     = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(["All"]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading]   = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch categories from backend ─────────────────────────────────────────
  useEffect(() => {
    fetch("/api/products/categories")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(() => {/* keep defaults */});
  }, []);

  // ── Fetch products whenever URL params change ──────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setErrorMessage("");

        const params = new URLSearchParams();
        params.set("page", pageParam.toString());
        params.set("limit", "12");
        if (searchQuery) params.set("q", searchQuery);
        if (selectedCat && selectedCat !== "All") params.set("category", selectedCat);
        if (selectedSort) params.set("sort", selectedSort);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Products request failed");

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
  }, [searchQuery, selectedCat, selectedSort, pageParam]);

  // ── Push updated URL params ───────────────────────────────────────────────
  const pushParams = useCallback((q: string, cat: string, sort: string, page = 1) => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (cat && cat !== "All") params.set("category", cat);
    if (sort) params.set("sort", sort);
    params.set("page", String(page));
    const qs = params.toString();
    router.push(qs ? `/shop?${qs}` : "/shop");
  }, [router]);

  // ── Debounced search input ────────────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      pushParams(value, activeCategory, activeSort);
    }, 400);
  };

  // ── Category chip click ───────────────────────────────────────────────────
  const handleCategoryClick = (cat: string) => {
    setActiveCategory(cat);
    pushParams(searchInput, cat, activeSort);
  };

  // ── Sort change ───────────────────────────────────────────────────────────
  const handleSortChange = (sort: string) => {
    setActiveSort(sort);
    pushParams(searchInput, activeCategory, sort);
  };

  // ── Reset all ────────────────────────────────────────────────────────────
  const resetAll = () => {
    setSearchInput("");
    setActiveCategory("All");
    setActiveSort("");
    router.push("/shop");
  };

  // ── Cart ──────────────────────────────────────────────────────────────────
  const handleAddToCart = (product: Product) => {
    addToCart(product);
    setAddedProductId(product.id);
    window.setTimeout(() => setAddedProductId(null), 1200);
  };

  const hasActiveFilters = searchQuery || selectedCat !== "All" || selectedSort;

  return (
    <main className="lp-root bg-white pb-24 pt-6">
      <div className="lp-section-inner flex flex-col gap-8">

        {/* ── Header ── */}
        <section className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="lp-section-label">Panchavati Mart</p>
            <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight">
              Shop Fresh Groceries
            </h1>
            <p className="text-gray-500 mt-1.5 text-sm">
              {isLoading ? "Loading…" : `${totalItems} product${totalItems === 1 ? "" : "s"} available`}
            </p>
          </div>
          <Link href="/cart" className="lp-cta-btn self-start sm:self-auto mt-3 sm:mt-0">
            Go to Cart →
          </Link>
        </section>

        {/* ── Search & Controls ── */}
        <section className="flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400 pointer-events-none" style={{width:"18px",height:"18px"}} />
            <input
              id="product-search"
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search products, categories…"
              className="w-full h-12 pl-11 pr-10 rounded-2xl border border-gray-200 bg-white text-gray-900 text-sm font-medium placeholder:text-gray-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition shadow-sm"
            />
            {searchInput && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category chips + Sort toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category chips */}
            <div className="flex items-center gap-2 flex-wrap flex-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-4 py-2 min-h-[40px] rounded-full text-xs sm:text-sm font-bold transition-all duration-150 border whitespace-nowrap flex items-center justify-center ${
                    activeCategory === cat
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400 hover:text-emerald-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort + filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center justify-center min-h-[40px] gap-1.5 px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all duration-150 whitespace-nowrap ${
                showFilters || activeSort
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-700"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Sort {activeSort && `· ${SORT_OPTIONS.find(s => s.value === activeSort)?.label}`}
            </button>
          </div>

          {/* Sort pills — expand/collapse */}
          {showFilters && (
            <div className="flex items-center gap-2 flex-wrap px-1 py-2 bg-gray-50 rounded-2xl border border-gray-100">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider px-2">Sort by</span>
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { handleSortChange(opt.value); setShowFilters(false); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    activeSort === opt.value
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Active filters summary + reset */}
          {hasActiveFilters && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 font-medium">Active filters:</span>
              {searchQuery && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-100">
                  Search: "{searchQuery}"
                  <button onClick={() => handleSearchChange("")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {selectedCat !== "All" && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100">
                  {selectedCat}
                  <button onClick={() => handleCategoryClick("All")}><X className="h-3 w-3" /></button>
                </span>
              )}
              {selectedSort && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-100">
                  {SORT_OPTIONS.find(s => s.value === selectedSort)?.label}
                  <button onClick={() => handleSortChange("")}><X className="h-3 w-3" /></button>
                </span>
              )}
              <button
                onClick={resetAll}
                className="text-xs font-bold text-red-500 hover:text-red-700 underline underline-offset-2 ml-1"
              >
                Reset all
              </button>
            </div>
          )}
        </section>

        {/* ── Product Grid ── */}
        <section>
          {isLoading ? (
            <ProductGridSkeleton count={12} />
          ) : errorMessage ? (
            <div className="flex items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50 py-24 text-red-600 font-medium">
              {errorMessage}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50 py-20 px-6 text-center">
              <span className="text-6xl mb-5" aria-hidden="true">🔍</span>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500 text-sm max-w-xs mb-6">
                We couldn't find any products matching your filters. Try adjusting your search.
              </p>
              <button
                onClick={resetAll}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-bold text-white transition hover:bg-emerald-700 shadow-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((product) => (
                  <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={() => handleAddToCart(product)}
                    actionLabel={addedProductId === product.id ? "Added" : "Add to Cart"}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-3">
                  <button
                    onClick={() => pushParams(searchInput, activeCategory, activeSort, Math.max(1, pageParam - 1))}
                    disabled={pageParam === 1 || isLoading}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold text-gray-600 min-w-[80px] text-center">
                    {pageParam} / {totalPages}
                  </span>
                  <button
                    onClick={() => pushParams(searchInput, activeCategory, activeSort, Math.min(totalPages, pageParam + 1))}
                    disabled={pageParam === totalPages || isLoading}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-4 w-4" />
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
