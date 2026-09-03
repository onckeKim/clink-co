import "server-only";
import { getAllOrders } from "@/lib/orders/store";
import { removeProductRecord } from "./products-store";

export type DeleteProductResult = { ok: true } | { ok: false; reason: string };

/**
 * Refuses to delete a product referenced by any past order — archive it
 * instead so order history stays intact. Safe otherwise: `OrderLineItem` is
 * a fully denormalized snapshot (name/image/price at time of purchase), so
 * nothing else in the app depends on the product record surviving deletion.
 *
 * Kept out of products-store.ts deliberately: that module's read functions
 * are used from client components (via src/data/products.ts), and
 * orders/store.ts depends on the DB-backed, server-only settings store —
 * importing it there would pull a server-only chain into the client
 * bundle. This file is only ever imported from the admin DELETE route.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  const orders = await getAllOrders();
  const referenced = orders.some((order) => order.lines.some((line) => line.productId === id));
  if (referenced) {
    return { ok: false, reason: "This product appears in past orders and can't be deleted — archive it instead." };
  }
  removeProductRecord(id);
  return { ok: true };
}
