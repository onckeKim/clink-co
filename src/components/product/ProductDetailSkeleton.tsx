/** Suspense fallback for /products/[slug] — mirrors ProductDetailView's layout so there's no shift once real content resolves. */
export function ProductDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8" aria-busy="true" aria-label="Loading product">
      <div className="mb-8 h-3 w-52 animate-pulse rounded-full bg-sand/50" />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-3">
          <div className="aspect-square animate-pulse rounded-3xl bg-sand/50" />
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-sand/50" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <div className="h-3 w-32 animate-pulse rounded-full bg-sand/50" />
            <div className="h-9 w-3/4 animate-pulse rounded-full bg-sand/50" />
            <div className="h-4 w-40 animate-pulse rounded-full bg-sand/40" />
          </div>
          <div className="h-7 w-32 animate-pulse rounded-full bg-sand/50" />
          <div className="flex flex-col gap-2">
            <div className="h-3 w-full animate-pulse rounded-full bg-sand/40" />
            <div className="h-3 w-5/6 animate-pulse rounded-full bg-sand/40" />
          </div>
          <div className="h-24 animate-pulse rounded-2xl bg-sand/40" />
          <div className="flex gap-3">
            <div className="h-13 flex-1 animate-pulse rounded-full bg-sand/50" />
            <div className="h-13 w-13 animate-pulse rounded-full bg-sand/50" />
            <div className="h-13 w-13 animate-pulse rounded-full bg-sand/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
