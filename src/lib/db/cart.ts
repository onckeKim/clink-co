import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type CartRow = Database["public"]["Tables"]["carts"]["Row"];
type CartItemRow = Database["public"]["Tables"]["cart_items"]["Row"];

/**
 * Everything in this file assumes `userId` is a signed-in user and reads/
 * writes through the RLS-enforced client — carts_all_own and
 * cart_items_all_own (supabase/migrations/20250101000300_carts_and_wishlists.sql)
 * already restrict every row to `user_id = auth.uid()`, so there's no
 * separate ownership check to write here; a mismatched userId simply
 * finds no rows rather than leaking another customer's cart.
 *
 * A GUEST cart (no signed-in user) is deliberately out of scope for this
 * module — see the file header on that migration for why: RLS can't
 * express "this anonymous browser owns this session_id" (auth.uid() is
 * null for anon), so guest cart reads/writes go through a Route Handler
 * using the service-role client instead, validating the guest's
 * session_id against an httpOnly cookie the browser can't forge.
 */

export async function getOrCreateActiveCart(userId: string): Promise<CartRow> {
  const db = await getDb();
  const existing = await db.from("carts").select("*").eq("user_id", userId).eq("status", "active").maybeSingle();
  const found = unwrapNullable(existing);
  if (found) return found;

  const created = await db.from("carts").insert({ user_id: userId }).select().single();
  return unwrap(created);
}

export async function listCartItems(cartId: string): Promise<CartItemRow[]> {
  const db = await getDb();
  const { data, error } = await db.from("cart_items").select("*").eq("cart_id", cartId).order("created_at");
  return unwrap({ data, error });
}

/** Adds a line, or increases quantity if this exact (product, variant) pair is already in the cart. `unitPrice` should be the product's current live price — the caller re-reads it from getProductBySlug(), never trusts a client-supplied price. */
export async function addCartItem(
  cartId: string,
  input: { productId: string; variantId?: string | null; quantity: number; unitPrice: number },
): Promise<CartItemRow> {
  const db = await getDb();
  let existingQuery = db.from("cart_items").select("*").eq("cart_id", cartId).eq("product_id", input.productId);
  existingQuery = input.variantId ? existingQuery.eq("variant_id", input.variantId) : existingQuery.is("variant_id", null);
  const existing = await existingQuery.maybeSingle();
  const foundRow = unwrapNullable(existing);

  if (foundRow) {
    const updated = await db
      .from("cart_items")
      .update({ quantity: foundRow.quantity + input.quantity })
      .eq("id", foundRow.id)
      .select()
      .single();
    return unwrap(updated);
  }

  const created = await db
    .from("cart_items")
    .insert({
      cart_id: cartId,
      product_id: input.productId,
      variant_id: input.variantId ?? null,
      quantity: input.quantity,
      unit_price_snapshot: input.unitPrice,
    })
    .select()
    .single();
  return unwrap(created);
}

export async function updateCartItemQuantity(itemId: string, quantity: number): Promise<CartItemRow> {
  const db = await getDb();
  const { data, error } = await db.from("cart_items").update({ quantity }).eq("id", itemId).select().single();
  return unwrap({ data, error });
}

export async function removeCartItem(itemId: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("cart_items").delete().eq("id", itemId);
  if (error) throw mapPostgrestError(error);
}
