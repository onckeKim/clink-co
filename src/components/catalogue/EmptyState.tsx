import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title = "No products found",
  description = "Try adjusting your filters or search to find what you're looking for.",
  onClearFilters,
}: {
  title?: string;
  description?: string;
  onClearFilters?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-sand py-24 text-center">
      <PackageSearch className="h-10 w-10 text-stone" strokeWidth={1.5} aria-hidden />
      <div>
        <p className="font-display text-xl text-charcoal">{title}</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone">{description}</p>
      </div>
      {onClearFilters && (
        <Button type="button" variant="secondary" onClick={onClearFilters}>
          Clear all filters
        </Button>
      )}
    </div>
  );
}
