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
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
