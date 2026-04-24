// Shared skeleton shimmer components for loading states

export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-square w-full bg-gray-100" />
      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        <div className="h-3 w-16 rounded-full bg-gray-100" />
        <div className="h-4 w-full rounded-full bg-gray-100" />
        <div className="h-4 w-3/4 rounded-full bg-gray-100" />
        <div className="mt-2 flex items-center justify-between">
          <div className="h-6 w-14 rounded-full bg-gray-100" />
          <div className="h-9 w-20 rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function AiResultSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-2xl border border-zinc-100 bg-white/70"
        />
      ))}
    </div>
  );
}

export function ProductDetailsSkeleton() {
  return (
    <div className="lp-section-inner mt-12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
      <div className="relative aspect-square w-full rounded-3xl bg-gray-100 animate-pulse border border-gray-100 p-8 flex items-center justify-center overflow-hidden" />
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-4 w-24 rounded-full bg-gray-100 mb-2" />
        <div className="h-12 w-3/4 rounded-xl bg-gray-100 mb-2" />
        <div className="flex gap-2 items-end mb-4">
          <div className="h-10 w-32 rounded-xl bg-gray-100" />
          <div className="h-6 w-16 rounded-lg bg-gray-100" />
        </div>
        <div className="h-8 w-32 rounded-full bg-gray-100 mb-6" />
        <div className="h-px w-full bg-gray-200 mb-6" />
        <div className="h-6 w-32 rounded-lg bg-gray-100 mb-2" />
        <div className="space-y-3 mb-8">
          <div className="h-4 w-full rounded-full bg-gray-100" />
          <div className="h-4 w-full rounded-full bg-gray-100" />
          <div className="h-4 w-2/3 rounded-full bg-gray-100" />
        </div>
        <div className="mt-auto pt-4 flex gap-4">
          <div className="h-14 w-48 rounded-xl bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

export function AiHistorySkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-zinc-100 bg-white p-6 shadow-sm animate-pulse">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2 w-full">
              <div className="h-6 w-1/3 rounded-xl bg-gray-100" />
              <div className="h-4 w-32 rounded-lg bg-gray-100" />
            </div>
            <div className="flex gap-2">
              <div className="h-10 w-24 rounded-lg bg-gray-100" />
              <div className="h-10 w-28 rounded-lg bg-gray-100" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
