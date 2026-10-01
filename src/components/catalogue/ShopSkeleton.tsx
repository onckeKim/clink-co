import { ProductGridSkeleton } from "@/components/catalogue/ProductGridSkeleton";

/** Route-level Suspense fallback for /shop, /shop/[category] and /collections/[collection] — mirrors ShopExperience's outer layout so there's no layout shift once it resolves. */
export function ShopSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <div className="mb-6 h-3 w-40 animate-pulse rounded-full bg-sand/50" />
      <div className="mb-8 h-9 w-64 animate-pulse rounded-full bg-sand/50" />
      <ProductGridSkeleton />
    </div>
  );
}
