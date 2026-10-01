import { useCartStore } from "@/store/cart-store";
import type { Order } from "@/lib/orders/types";
import type { Product } from "@/types/product";

export interface BuyAgainResult {
  addedCount: number;
  unavailable: string[];
}

/**
 * Re-adds every line of a past order to the cart, using live product data
 * (price, stock, variant) rather than the order's own historical snapshot
 * — a line whose product has since been discontinued or sold out is
 * skipped and named in `unavailable` rather than added at a stale price.
 * `products` is the caller's already-loaded active product list
 * (useCatalog().products) — this stays a pure function over it rather than
 * fetching internally, same reasoning as lib/catalogue.ts's cross-sell
 * helpers, since it's called from a client event handler that already has
 * the list on hand.
 */
export function buyAgainFromOrder(order: Order, products: Product[]): BuyAgainResult {
  const { addItem } = useCartStore.getState();
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  let addedCount = 0;
  const unavailable: string[] = [];

  for (const line of order.lines) {
    const product = bySlug.get(line.slug);
    if (!product || !product.inStock || product.discontinued) {
      unavailable.push(line.name);
      continue;
    }

    const variant = line.variantLabel
      ? product.variants?.find((v) => v.label === line.variantLabel)
      : undefined;

    addItem(product, { variant, quantity: line.quantity });
    addedCount += 1;
  }

  return { addedCount, unavailable };
}
