import type { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";
import { cn } from "@/lib/utils";

export function ProductGrid({
  products,
  className,
  onQuickView,
}: {
  products: Product[];
  className?: string;
  onQuickView?: (product: Product) => void;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4",
        className,
      )}
    >
      {products.map((product) => (
        <ProductCard key={product.id} product={product} detailed onQuickView={onQuickView} />
      ))}
    </div>
  );
}
