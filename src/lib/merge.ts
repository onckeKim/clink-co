import type { CartLine } from "@/store/cart-store";
import type { WishlistItem } from "@/store/wishlist-store";

/**
 * Merges a guest cart into an account's saved cart on login — guest
 * quantities add to a matching existing line rather than overwriting it,
 * so nothing already saved to the account is lost. Pure and store-agnostic
 * so it's trivial to unit test independently of Zustand or Supabase.
 */
export function mergeCartLines(accountLines: CartLine[], guestLines: CartLine[]): CartLine[] {
  const merged = [...accountLines];
  for (const guestLine of guestLines) {
    const index = merged.findIndex((line) => line.lineId === guestLine.lineId);
    if (index >= 0) {
      merged[index] = { ...merged[index], quantity: merged[index].quantity + guestLine.quantity };
    } else {
      merged.push(guestLine);
    }
  }
  return merged;
}

/** Merges a guest wishlist into an account's saved wishlist, de-duplicated by product id. */
export function mergeWishlistItems(accountItems: WishlistItem[], guestItems: WishlistItem[]): WishlistItem[] {
  const merged = [...accountItems];
  for (const guestItem of guestItems) {
    if (!merged.some((item) => item.productId === guestItem.productId)) {
      merged.push(guestItem);
    }
  }
  return merged;
}
