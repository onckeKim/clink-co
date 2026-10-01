import { Ban } from "lucide-react";

export function DiscontinuedNotice({ productName }: { productName: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-stone/30 bg-porcelain p-4">
      <Ban className="mt-0.5 h-5 w-5 shrink-0 text-stone" aria-hidden />
      <div>
        <p className="text-sm font-medium text-charcoal">This product has been discontinued</p>
        <p className="mt-1 text-sm text-stone">
          {productName} is no longer available to purchase. Browse similar pieces below, or explore the
          rest of the range.
        </p>
      </div>
    </div>
  );
}
