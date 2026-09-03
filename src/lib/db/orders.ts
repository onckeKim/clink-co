import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getDb } from "./client";
import { DatabaseUnavailableError, mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];

/**
 * Server-role order creation — there is no RLS INSERT policy on `orders`
 * for anon/authenticated at all (see 0004_orders_payments_shipments.sql),
 * by design: a customer must never be able to write their own totals.
 * This is the one function in the whole data-access layer that requires
 * the service-role client, and it must only ever be called from a Route
 * Handler (POST /api/checkout) after the server has independently
 * recomputed subtotal/discount/delivery/tax from live product prices —
 * `input.total` is trusted here because it was computed here, never
 * because a client sent it.
 *
 * Note on atomicity: this does two separate writes (the order, then its
 * line items) rather than one transaction, because supabase-js has no
 * multi-statement transaction API of its own. A production system would
 * fold both into a single SECURITY DEFINER function the same way
 * redeem_discount_code() (0005_promotions.sql) wraps its own
 * read-check-write sequence — worth doing before this handles real
 * traffic, flagged here rather than silently assumed away.
 */
export async function createOrderServerSide(
  order: OrderInsert,
  items: Omit<OrderItemInsert, "order_id">[],
): Promise<OrderRow & { items: OrderItemInsert[] }> {
  const db = createServiceClient();
  if (!db) throw new DatabaseUnavailableError();

  const existing = await db.from("orders").select("*").eq("idempotency_key", order.idempotency_key).maybeSingle();
  const existingOrder = unwrapNullable(existing);
  if (existingOrder) {
    const existingItems = await db.from("order_items").select("*").eq("order_id", existingOrder.id);
    return { ...existingOrder, items: unwrap(existingItems) };
  }

  const created = await db.from("orders").insert(order).select().single();
  const newOrder = unwrap(created);

  const { data: insertedItems, error: itemsError } = await db
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: newOrder.id })))
    .select();
  if (itemsError) throw mapPostgrestError(itemsError);

  return { ...newOrder, items: insertedItems ?? [] };
}

/** Own order (customer session) or any order (staff with orders:view) — RLS decides which, this just runs the query. */
export async function getOrderByNumber(orderNumber: string) {
  const db = await getDb();
  const orderResult = await db.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  const order = unwrapNullable(orderResult);
  if (!order) return null;

  const itemsResult = await db.from("order_items").select("*").eq("order_id", order.id).order("created_at");
  return { ...order, items: unwrap(itemsResult) };
}

export async function listMyOrders(userId: string): Promise<OrderRow[]> {
  const db = await getDb();
  const { data, error } = await db.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return unwrap({ data, error });
}

/** Staff-only (orders:fulfil enforces this via the column GRANT + RLS on `orders` — see 0004_orders_payments_shipments.sql). Only the operational columns listed there are actually writable through this client. */
export async function updateOrderStatus(orderNumber: string, status: Database["public"]["Enums"]["order_status"]): Promise<OrderRow> {
  const db = await getDb();
  const { data, error } = await db.from("orders").update({ status }).eq("order_number", orderNumber).select().single();
  return unwrap({ data, error });
}
