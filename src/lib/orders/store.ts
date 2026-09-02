import type { Order, OrderStatus } from "./types";

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
  return `CC-${datePart}-${String(dailyCounter).padStart(4, "0")}`;
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

export function updateOrder(
  orderNumber: string,
  patch: Partial<Pick<Order, "status" | "paymentReference" | "paymentRedirectUrl">>,
): Order | undefined {
  const order = getOrderByNumber(orderNumber);
  if (!order) return undefined;
  Object.assign(order, patch, { updatedAt: new Date().toISOString() });
  return order;
}

export function setOrderStatus(orderNumber: string, status: OrderStatus): Order | undefined {
  return updateOrder(orderNumber, { status });
}

/** `eventKey` should be unique per provider event, e.g. `${provider}:${providerEventId}`. */
export function hasProcessedWebhookEvent(eventKey: string): boolean {
  return processedWebhookEvents.has(eventKey);
}

export function markWebhookEventProcessed(eventKey: string): void {
  processedWebhookEvents.add(eventKey);
}
