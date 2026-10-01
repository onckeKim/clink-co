import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { DatabaseUnavailableError, mapPostgrestError, unwrap, unwrapNullable, ConflictError } from "./errors";
import type { Database } from "@/lib/supabase/types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];
type OrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
type OrderUpdate = Database["public"]["Tables"]["orders"]["Update"];
type OrderItemInsert = Database["public"]["Tables"]["order_items"]["Insert"];
type OrderItemRow = Database["public"]["Tables"]["order_items"]["Row"];
type PaymentMethodEnum = Database["public"]["Enums"]["payment_method"];
type PaymentStatusEnum = Database["public"]["Enums"]["payment_status"];

export type OrderWithItems = OrderRow & { items: OrderItemRow[] };

/**
 * Hand-authored types.ts has no Relationships metadata (see the same note
 * in src/lib/email/abandoned-cart.ts), so an embedded select like
 * `orders(*, order_items(*))` needs an explicit cast on the way out.
 */
function castEmbedded(rows: unknown): OrderWithItems[] {
  return rows as OrderWithItems[];
}

/**
 * Every function here uses the service-role client, not the RLS-scoped one
 * (getDb()). That mirrors exactly how this store worked before it was
 * backed by a real table: the in-memory version had no access-control
 * concept of its own at all — every caller (account routes checking
 * `order.userId === user.id`, admin routes checking `hasPermission(...,
 * "orders:view")`, the confirmation page trusting the order number alone)
 * did its own authorization in application code, and this store just
 * returned data. Keeping that authorization at the call site (unchanged)
 * and using the service role here reproduces identical behavior — RLS on
 * `orders`/`order_items`/`payments` (0004_orders_payments_shipments.sql)
 * still stands as defense-in-depth against any *other* path (a client
 * using the anon/authenticated key directly) ever reaching these rows.
 */
function db() {
  const client = createServiceClient();
  if (!client) throw new DatabaseUnavailableError();
  return client;
}

async function withItems(client: ReturnType<typeof db>, order: OrderRow): Promise<OrderWithItems> {
  const itemsResult = await client.from("order_items").select("*").eq("order_id", order.id).order("created_at");
  return { ...order, items: unwrap(itemsResult) };
}

/**
 * Server-role order creation — there is no RLS INSERT policy on `orders`
 * for anon/authenticated at all (see 0004_orders_payments_shipments.sql),
 * by design: a customer must never be able to write their own totals.
 * This must only ever be called from a Route Handler (POST /api/checkout)
 * after the server has independently recomputed subtotal/discount/
 * delivery/tax from live product prices — `input.total` is trusted here
 * because it was computed here, never because a client sent it.
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
): Promise<OrderWithItems> {
  const client = db();

  const existing = await client.from("orders").select("*").eq("idempotency_key", order.idempotency_key).maybeSingle();
  const existingOrder = unwrapNullable(existing);
  if (existingOrder) return withItems(client, existingOrder);

  const created = await client.from("orders").insert(order).select().single();
  const newOrder = unwrap(created);

  const { data: insertedItems, error: itemsError } = await client
    .from("order_items")
    .insert(items.map((item) => ({ ...item, order_id: newOrder.id })))
    .select();
  if (itemsError) throw mapPostgrestError(itemsError);

  return { ...newOrder, items: insertedItems ?? [] };
}

export async function getOrderByIdempotencyKey(key: string): Promise<OrderWithItems | null> {
  const client = db();
  const orderResult = await client.from("orders").select("*").eq("idempotency_key", key).maybeSingle();
  const order = unwrapNullable(orderResult);
  if (!order) return null;
  return withItems(client, order);
}

export async function getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null> {
  const client = db();
  const orderResult = await client.from("orders").select("*").eq("order_number", orderNumber).maybeSingle();
  const order = unwrapNullable(orderResult);
  if (!order) return null;
  return withItems(client, order);
}

/** Webhook lookup for a provider that reports the payment reference but not the order number (see NormalizedWebhookEvent). */
export async function getOrderByPaymentReference(reference: string): Promise<OrderWithItems | null> {
  const client = db();
  const orderResult = await client.from("orders").select("*").eq("payment_reference", reference).maybeSingle();
  const order = unwrapNullable(orderResult);
  if (!order) return null;
  return withItems(client, order);
}

/** Includes each order's line items — the account order-history list shows item counts/thumbnails, so a summary-only read isn't enough. */
export async function listOrdersByUserId(userId: string): Promise<OrderWithItems[]> {
  const client = db();
  const { data, error } = await client
    .from("orders")
    .select("*, order_items(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw mapPostgrestError(error);
  return castEmbedded(data ?? []);
}

/**
 * Every order, most recent first, with line items — the admin order list's
 * unfiltered backing, the dashboard's bestseller/revenue calculations (both
 * read `order.lines`), and cross-store safety checks (e.g. refusing to
 * delete a product referenced in past orders).
 */
export async function listAllOrders(): Promise<OrderWithItems[]> {
  const client = db();
  const { data, error } = await client.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
  if (error) throw mapPostgrestError(error);
  return castEmbedded(data ?? []);
}

/**
 * Generic order patch — status, payment reference/redirect (checkout,
 * webhook), tracking (admin), cancellation reason (admin), refund fields
 * (admin). One function rather than one per field, matching the shape
 * the in-memory updateOrder() already had.
 */
export async function updateOrder(orderNumber: string, patch: OrderUpdate): Promise<OrderRow> {
  const client = db();
  const { data, error } = await client.from("orders").update(patch).eq("order_number", orderNumber).select().single();
  return unwrap({ data, error });
}

/**
 * Links every unclaimed guest order matching `email` (case-insensitive —
 * customer_email is citext) to `userId`. Only matches orders with no
 * `user_id` yet, so it never re-parents an order that belongs to someone
 * else. Returns how many orders were linked.
 */
export async function linkGuestOrdersToUser(email: string, userId: string): Promise<number> {
  const client = db();
  // `user_id`/`is_guest` aren't in the generated Update type (it's scoped to
  // the columns the `authenticated` role's own column GRANT allows —
  // deliberately narrower than what the service role can actually write),
  // so this cast is a legitimate widening for a service-role-only write.
  const { data, error } = await client
    .from("orders")
    .update({ user_id: userId, is_guest: false } as unknown as OrderUpdate)
    .eq("customer_email", email)
    .is("user_id", null)
    .select("id");
  if (error) throw mapPostgrestError(error);
  return (data ?? []).length;
}

export interface AdminOrderFilters {
  /** Matches order number, customer name or email (case-insensitive substring). */
  search?: string;
  status?: Database["public"]["Enums"]["order_status"];
  paymentMethod?: PaymentMethodEnum;
}

/** Every order matching the given filters, most recent first, with line items (the CSV export sums item counts per order) — the admin order list's search/filter backing. */
export async function listAdminOrders(filters?: AdminOrderFilters): Promise<OrderWithItems[]> {
  const client = db();
  let query = client.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });

  if (filters?.search) {
    const q = filters.search.trim().replace(/[%,]/g, "");
    query = query.or(`order_number.ilike.%${q}%,customer_name.ilike.%${q}%,customer_email.ilike.%${q}%`);
  }
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.paymentMethod) query = query.eq("payment_method", filters.paymentMethod);

  const { data, error } = await query;
  if (error) throw mapPostgrestError(error);
  return castEmbedded(data ?? []);
}

/**
 * Claims a webhook event exactly once: inserts a lightweight row into the
 * `payments` ledger keyed by `processed_webhook_event_id` (unique — see
 * 0004_orders_payments_shipments.sql), so a concurrent or redelivered
 * webhook for the same event fails the insert atomically instead of
 * relying on an in-process Set. Returns true if this call claimed the
 * event (safe to apply the status change), false if it was already
 * processed. Doesn't attempt a fuller "pending payment created at
 * checkout, updated by webhook" ledger — see createOrderServerSide's own
 * note on the one thing still worth doing before this handles real
 * production traffic.
 */
export async function claimWebhookEvent(params: {
  orderId: string;
  provider: PaymentMethodEnum;
  eventKey: string;
  amount: number;
  status: PaymentStatusEnum;
  providerReference?: string;
}): Promise<boolean> {
  const client = db();
  const { error } = await client.from("payments").insert({
    order_id: params.orderId,
    provider: params.provider,
    provider_reference: params.providerReference,
    amount: params.amount,
    status: params.status,
    processed_webhook_event_id: params.eventKey,
  });
  if (!error) return true;
  const mapped = mapPostgrestError(error);
  if (mapped instanceof ConflictError) return false;
  throw mapped;
}
