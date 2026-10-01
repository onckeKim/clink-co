import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Simple prev/next + page-count pagination for admin list screens (client-side paging over an already-fetched, filtered array — these admin lists are small enough in this in-memory-store demo that server-side cursoring isn't needed). */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  className,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  className?: string;
}) {
  if (pageCount <= 1) return null;

  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <p className="text-xs text-stone">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-sand text-charcoal transition-colors hover:border-charcoal/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-sand text-charcoal transition-colors hover:border-charcoal/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
