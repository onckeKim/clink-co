import { cn } from "@/lib/utils";

export function ProductGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
      role="status"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-4" aria-hidden>
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-sand/50" />
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-sand/50" />
            <div className="h-3 w-1/2 animate-pulse rounded-full bg-sand/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
