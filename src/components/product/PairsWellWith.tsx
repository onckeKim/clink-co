import type { Product } from "@/types/product";
import { ProductGrid } from "@/components/catalogue/ProductGrid";

export function PairsWellWith({
  products,
  onQuickView,
}: {
  products: Product[];
  onQuickView: (product: Product) => void;
}) {
  if (products.length === 0) return null;

  return (
    <div>
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-stone">Pairs well with</p>
      <ProductGrid products={products} onQuickView={onQuickView} />
    </div>
  );
}
