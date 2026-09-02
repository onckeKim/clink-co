import { getProductBySlug } from "@/data/products";
import { useCartStore } from "@/store/cart-store";
import type { Order } from "@/lib/orders/types";

export interface BuyAgainResult {
  addedCount: number;
  unavailable: string[];
}

/**
 * Re-adds every line of a past order to the cart, using live product data
 * (price, stock, variant) rather than the order's own historical snapshot
 * — a line whose product has since been discontinued or sold out is
 * skipped and named in `unavailable` rather than added at a stale price.
 */
export function buyAgainFromOrder(order: Order): BuyAgainResult {
  const { addItem } = useCartStore.getState();
  let addedCount = 0;
  const unavailable: string[] = [];

  for (const line of order.lines) {
    const product = getProductBySlug(line.slug);
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
