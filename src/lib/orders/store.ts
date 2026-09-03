import type { Order, OrderStatus, PaymentMethodId } from "./types";
import { getStoreSettings } from "@/lib/admin/settings-store";

/**
 * In-memory orders store — a development/demo substitute for a real
 * `orders` table. This is deliberately NOT production-safe: it resets on
 * every server restart/redeploy, and a real serverless deployment can run
 * multiple instances that would each hold a different copy of this Map, so
 * the idempotency guarantee below only holds within a single process.
 *
 * Moving to Supabase means replacing the bodies of these functions with
 * real queries against an `orders` table that has a UNIQUE constraint on
 * `idempotency_key` (so a concurrent duplicate INSERT fails atomically
 * instead of relying on an in-process Map check-then-set) and a
 * `processed_webhook_events` table keyed by `(provider, event_id)` for the
 * same reason. The function signatures here are written to match that
 * future shape 1:1.
 */

const ordersById = new Map<string, Order>();
const idByOrderNumber = new Map<string, string>();
const idByIdempotencyKey = new Map<string, string>();
const processedWebhookEvents = new Set<string>();

let counterDate = "";
let dailyCounter = 0;

function nextOrderNumber(): string {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  if (counterDate !== datePart) {
    counterDate = datePart;
    dailyCounter = 0;
  }
  dailyCounter += 1;
  const prefix = getStoreSettings().orderNumberPrefix;
  return `${prefix}-${datePart}-${String(dailyCounter).padStart(4, "0")}`;
}

export function findOrderByIdempotencyKey(key: string): Order | undefined {
  const id = idByIdempotencyKey.get(key);
  return id ? ordersById.get(id) : undefined;
}

/**
 * Creates an order — or, if an order already exists for this
 * `idempotencyKey` (a retried request, a double-click, a network replay),
 * returns the existing one unchanged instead of creating a duplicate.
 */
export function createOrder(
  input: Omit<Order, "id" | "orderNumber" | "status" | "createdAt" | "updatedAt">,
): Order {
  const existing = findOrderByIdempotencyKey(input.idempotencyKey);
  if (existing) return existing;

  const now = new Date().toISOString();
  const order: Order = {
    ...input,
    id: crypto.randomUUID(),
    orderNumber: nextOrderNumber(),
    status: "pending_payment",
    createdAt: now,
    updatedAt: now,
  };

  ordersById.set(order.id, order);
  idByOrderNumber.set(order.orderNumber, order.id);
  idByIdempotencyKey.set(order.idempotencyKey, order.id);
  return order;
}

export function getOrderByNumber(orderNumber: string): Order | undefined {
  const id = idByOrderNumber.get(orderNumber);
  return id ? ordersById.get(id) : undefined;
}

export function getOrderByPaymentReference(reference: string): Order | undefined {
  for (const order of ordersById.values()) {
    if (order.paymentReference === reference) return order;
  }
  return undefined;
}

/** All orders placed by a signed-in customer, most recent first. */
export function getOrdersByUserId(userId: string): Order[] {
  return [...ordersById.values()]
    .filter((order) => order.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Every order, most recent first — the admin order list (/admin/orders) and cross-store safety checks (e.g. refusing to delete a product that appears in past orders) read from this. */
export function getAllOrders(): Order[] {
  return [...ordersById.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Links every unclaimed guest order matching `email` to `userId` — called
 * after login/sign-up so a customer's past guest checkouts show up in
 * their order history. Only matches orders that don't already have a
 * `userId` (never re-parents an order that belongs to someone else), and
 * only ever by an exact, case-insensitive email match against the address
 * Supabase Auth has already verified for this account. Returns how many
 * orders were linked.
 */
export function linkGuestOrdersToUser(email: string, userId: string): number {
  const normalizedEmail = email.trim().toLowerCase();
  let linked = 0;
  for (const order of ordersById.values()) {
    if (order.userId) continue;
    if (order.customerEmail.trim().toLowerCase() !== normalizedEmail) continue;
    order.userId = userId;
    order.isGuest = false;
    order.updatedAt = new Date().toISOString();
    linked += 1;
  }
  return linked;
}

export function updateOrder(
  orderNumber: string,
  patch: Partial<
    Pick<
      Order,
      | "status"
      | "paymentReference"
      | "paymentRedirectUrl"
      | "trackingCarrier"
      | "trackingNumber"
      | "trackingUrl"
      | "cancelledReason"
      | "refundAmount"
      | "refundReason"
      | "refundedAt"
    >
  >,
): Order | undefined {
  const order = getOrderByNumber(orderNumber);
  if (!order) return undefined;
  Object.assign(order, patch, { updatedAt: new Date().toISOString() });
  return order;
}

export function setOrderStatus(orderNumber: string, status: OrderStatus): Order | undefined {
  return updateOrder(orderNumber, { status });
}

export function setOrderTracking(
  orderNumber: string,
  tracking: { trackingCarrier: string; trackingNumber: string; trackingUrl?: string },
): Order | undefined {
  return updateOrder(orderNumber, tracking);
}

export function cancelOrder(orderNumber: string, reason?: string): Order | undefined {
  return updateOrder(orderNumber, { status: "cancelled", cancelledReason: reason });
}

export function recordOrderRefund(
  orderNumber: string,
  refund: { amount: number; reason?: string },
): Order | undefined {
  return updateOrder(orderNumber, {
    refundAmount: refund.amount,
    refundReason: refund.reason,
    refundedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Admin-facing reads — /admin/orders and /api/admin/orders/**.
// ---------------------------------------------------------------------------

export interface AdminOrderFilters {
  /** Matches order number, customer name or email (case-insensitive substring). */
  search?: string;
  status?: OrderStatus;
  paymentMethod?: PaymentMethodId;
}

/** Every order matching the given filters, most recent first — the admin order list's search/filter backing. */
export function listAdminOrders(filters?: AdminOrderFilters): Order[] {
  let orders = getAllOrders();

  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    orders = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q),
    );
  }
  if (filters?.status) orders = orders.filter((o) => o.status === filters.status);
  if (filters?.paymentMethod) orders = orders.filter((o) => o.paymentMethod === filters.paymentMethod);

  return orders;
}

/** `eventKey` should be unique per provider event, e.g. `${provider}:${providerEventId}`. */
export function hasProcessedWebhookEvent(eventKey: string): boolean {
  return processedWebhookEvents.has(eventKey);
}

export function markWebhookEventProcessed(eventKey: string): void {
  processedWebhookEvents.add(eventKey);
}
