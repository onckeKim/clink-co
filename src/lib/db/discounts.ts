import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getDb } from "./client";
import { DatabaseUnavailableError, mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type DiscountCodeRow = Database["public"]["Tables"]["discount_codes"]["Row"];
type DiscountCodeInsert = Database["public"]["Tables"]["discount_codes"]["Insert"];
type DiscountCodeUpdate = Database["public"]["Tables"]["discount_codes"]["Update"];

/** Every currently-usable discount code (active, in its date window, under its usage limit) — RLS (discount_codes_select_public) already restricts anon/authenticated to exactly this set, so both a manual-code lookup and the cart's automatic-discount computation can use this same read. */
export async function getUsableDiscountCodes(): Promise<DiscountCodeRow[]> {
  const db = await getDb();
  const { data, error } = await db.from("discount_codes").select("*");
  return unwrap({ data, error });
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/promotions and /api/admin/coupons/**.
// Unlike getUsableDiscountCodes() above, these see every code regardless of
// active/date-window/usage-limit state (discount_codes_select_staff), gated
// by has_permission('promotions:view'/'promotions:write').
// ---------------------------------------------------------------------------

export async function listAllDiscountCodes(): Promise<DiscountCodeRow[]> {
  const db = await getDb();
  const { data, error } = await db.from("discount_codes").select("*").order("code", { ascending: true });
  return unwrap({ data, error });
}

export async function getDiscountCodeById(id: string): Promise<DiscountCodeRow | null> {
  const db = await getDb();
  const { data, error } = await db.from("discount_codes").select("*").eq("id", id).maybeSingle();
  return unwrapNullable({ data, error });
}

export async function createDiscountCode(input: DiscountCodeInsert): Promise<DiscountCodeRow> {
  const db = await getDb();
  const { data, error } = await db.from("discount_codes").insert(input).select().single();
  return unwrap({ data, error });
}

export async function updateDiscountCode(id: string, patch: DiscountCodeUpdate): Promise<DiscountCodeRow> {
  const db = await getDb();
  const { data, error } = await db.from("discount_codes").update(patch).eq("id", id).select().single();
  return unwrap({ data, error });
}

export async function deleteDiscountCode(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("discount_codes").delete().eq("id", id);
  if (error) throw mapPostgrestError(error);
}

/**
 * Atomically validates and redeems a code against an order — via the
 * redeem_discount_code() RPC (0005_promotions.sql), which row-locks the
 * code for the rest of the transaction so a usage-limited code can never
 * be oversold by two concurrent checkouts. EXECUTE on that function is
 * revoked from anon/authenticated (service-role only), so this must run
 * from the checkout Route Handler alongside createOrderServerSide(), not
 * from anything reachable directly by a browser session.
 */
export async function redeemDiscountCode(input: {
  code: string;
  orderId: string;
  userId: string | null;
  customerEmail: string;
  amountDiscounted: number;
}): Promise<void> {
  const db = createServiceClient();
  if (!db) throw new DatabaseUnavailableError();

  const { error } = await db.rpc("redeem_discount_code", {
    p_code: input.code,
    p_order_id: input.orderId,
    p_user_id: input.userId,
    p_customer_email: input.customerEmail,
    p_amount_discounted: input.amountDiscounted,
  });
  if (error) throw mapPostgrestError(error);
}
