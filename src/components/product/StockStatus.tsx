import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/** Stock levels at or below this are called out as "low stock" rather than a plain in-stock check. */
export const LOW_STOCK_THRESHOLD = 6;

export function StockStatus({ stockQuantity, inStock }: { stockQuantity: number; inStock: boolean }) {
  if (!inStock || stockQuantity <= 0) {
    return (
      <span className="flex items-center gap-1.5 text-sm font-medium text-error">
        <XCircle className="h-4 w-4" />
        Out of stock
      </span>
    );
  }

  if (stockQuantity <= LOW_STOCK_THRESHOLD) {
    return (
      <span className={cn("flex items-center gap-1.5 text-sm font-medium text-champagne")}>
        <AlertTriangle className="h-4 w-4" />
        Only {stockQuantity} left in stock — order soon
      </span>
    );
  }

  return (
    <span className="flex items-center gap-1.5 text-sm font-medium text-success">
      <CheckCircle2 className="h-4 w-4" />
      In stock
    </span>
  );
}
