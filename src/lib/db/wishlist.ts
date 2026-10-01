import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type WishlistRow = Database["public"]["Tables"]["wishlists"]["Row"];

export async function getOrCreateWishlist(userId: string): Promise<WishlistRow> {
  const db = await getDb();
  const existing = await db.from("wishlists").select("*").eq("user_id", userId).maybeSingle();
  const found = unwrapNullable(existing);
  if (found) return found;

  const created = await db.from("wishlists").insert({ user_id: userId }).select().single();
  return unwrap(created);
}

export async function listWishlistProductIds(wishlistId: string): Promise<string[]> {
  const db = await getDb();
  const { data, error } = await db.from("wishlist_items").select("product_id").eq("wishlist_id", wishlistId);
  return unwrap({ data, error }).map((row) => row.product_id);
}

/** Toggle semantics matching src/store/wishlist-store.ts: adds if absent, removes if present. Returns the new state. */
export async function toggleWishlistItem(wishlistId: string, productId: string): Promise<{ inWishlist: boolean }> {
  const db = await getDb();
  const existing = await db
    .from("wishlist_items")
    .select("id")
    .eq("wishlist_id", wishlistId)
    .eq("product_id", productId)
    .maybeSingle();
  const found = unwrapNullable(existing);

  if (found) {
    const { error } = await db.from("wishlist_items").delete().eq("id", found.id);
    if (error) throw mapPostgrestError(error);
    return { inWishlist: false };
  }

  const { error } = await db.from("wishlist_items").insert({ wishlist_id: wishlistId, product_id: productId });
  if (error) throw mapPostgrestError(error);
  return { inWishlist: true };
}

/** Replaces every item in a wishlist with exactly the given product id set — same delete-then-bulk-insert "whole-record overwrite" as replaceCartItems(), backing the account wishlist's continuous background sync from wishlist-store.ts. */
export async function replaceWishlistItems(wishlistId: string, productIds: string[]): Promise<void> {
  const db = await getDb();
  const del = await db.from("wishlist_items").delete().eq("wishlist_id", wishlistId);
  if (del.error) throw mapPostgrestError(del.error);
  if (productIds.length === 0) return;
  const rows = productIds.map((product_id) => ({ wishlist_id: wishlistId, product_id }));
  const ins = await db.from("wishlist_items").insert(rows);
  if (ins.error) throw mapPostgrestError(ins.error);
}

/**
 * Reads a shared wishlist by its token — via the get_wishlist_by_share_token
 * RPC, never a direct `.from("wishlists")` select, since there is
 * deliberately no RLS policy that would let that succeed for anon/another
 * user. See the function's own comment in
 * supabase/migrations/20250101000300_carts_and_wishlists.sql for why a
 * "select where share_token is not null" policy would be a real leak
 * (anyone could enumerate every shared wishlist, not just the one they
 * hold a link to) and this RPC is the safe alternative.
 */
export async function getSharedWishlistProductIds(token: string): Promise<string[]> {
  const db = await getDb();
  const { data, error } = await db.rpc("get_wishlist_by_share_token", { p_token: token });
  return unwrap({ data, error }).map((row) => row.product_id);
}
