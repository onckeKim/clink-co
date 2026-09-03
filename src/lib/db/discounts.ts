import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getDb } from "./client";
import { DatabaseUnavailableError, mapPostgrestError, unwrap } from "./errors";
import type { Database } from "@/lib/supabase/types";

type DiscountCodeRow = Database["public"]["Tables"]["discount_codes"]["Row"];

/** Every currently-usable discount code (active, in its date window, under its usage limit) — RLS (discount_codes_select_public) already restricts anon/authenticated to exactly this set, so both a manual-code lookup and the cart's automatic-discount computation can use this same read. */
export async function getUsableDiscountCodes(): Promise<DiscountCodeRow[]> {
  const db = await getDb();
  const { data, error } = await db.from("discount_codes").select("*");
  return unwrap({ data, error });
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
