import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];
type AddressInsert = Database["public"]["Tables"]["addresses"]["Insert"];
type AddressUpdate = Database["public"]["Tables"]["addresses"]["Update"];

/** RLS (addresses_all_own) already restricts every read/write here to `user_id = auth.uid()` — userId is passed through explicitly only so a mismatched call fails obviously in a test, not because it's load-bearing for security. */
export async function listAddresses(userId: string): Promise<AddressRow[]> {
  const db = await getDb();
  const { data, error } = await db.from("addresses").select("*").eq("user_id", userId).order("created_at");
  return unwrap({ data, error });
}

export async function getAddress(userId: string, id: string): Promise<AddressRow | null> {
  const db = await getDb();
  const { data, error } = await db.from("addresses").select("*").eq("user_id", userId).eq("id", id).maybeSingle();
  return unwrapNullable({ data, error });
}

/**
 * If this becomes the customer's only address (or the caller explicitly
 * asks), promotes it to default. The unique partial indexes
 * addresses_one_default_delivery/_billing (0001_identity_and_access.sql)
 * mean a naive INSERT here would fail with a 409 the moment a second
 * `is_default_delivery = true` row is attempted — so this always clears
 * the previous default first, inside one transaction via an RPC-free
 * two-step (select-then-update) since supabase-js has no multi-statement
 * transaction API; a stricter version of this would wrap both in a
 * SECURITY DEFINER function the same way redeem_discount_code() does.
 */
export async function createAddress(
  userId: string,
  input: Omit<AddressInsert, "user_id"> & { isDefaultDelivery?: boolean; isDefaultBilling?: boolean },
): Promise<AddressRow> {
  const db = await getDb();
  const { isDefaultDelivery, isDefaultBilling, ...addressFields } = input;
  const existing = await listAddresses(userId);
  const isFirst = existing.length === 0;
  const wantsDefaultDelivery = isDefaultDelivery ?? isFirst;
  const wantsDefaultBilling = isDefaultBilling ?? isFirst;

  if (wantsDefaultDelivery) await clearDefault(userId, "is_default_delivery");
  if (wantsDefaultBilling) await clearDefault(userId, "is_default_billing");

  const { data, error } = await db
    .from("addresses")
    .insert({
      ...addressFields,
      user_id: userId,
      is_default_delivery: wantsDefaultDelivery,
      is_default_billing: wantsDefaultBilling,
    })
    .select()
    .single();
  return unwrap({ data, error });
}

export async function updateAddress(userId: string, id: string, patch: AddressUpdate): Promise<AddressRow> {
  const db = await getDb();
  if (patch.is_default_delivery) await clearDefault(userId, "is_default_delivery");
  if (patch.is_default_billing) await clearDefault(userId, "is_default_billing");

  const { data, error } = await db.from("addresses").update(patch).eq("user_id", userId).eq("id", id).select().single();
  return unwrap({ data, error });
}

export async function deleteAddress(userId: string, id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("addresses").delete().eq("user_id", userId).eq("id", id);
  if (error) throw mapPostgrestError(error);
}

async function clearDefault(userId: string, field: "is_default_delivery" | "is_default_billing"): Promise<void> {
  const db = await getDb();
  const patch: AddressUpdate = field === "is_default_delivery" ? { is_default_delivery: false } : { is_default_billing: false };
  const { error } = await db.from("addresses").update(patch).eq("user_id", userId).eq(field, true);
  if (error) throw mapPostgrestError(error);
}
