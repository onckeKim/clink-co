import "server-only";
import type { Order, OrderAddress, OrderLineItem, OrderStatus, PaymentMethodId } from "./types";
import { getStoreSettings } from "@/lib/admin/settings-store";
import * as db from "@/lib/db/orders";
import type { OrderWithItems } from "@/lib/db/orders";
import type { Database } from "@/lib/supabase/types";

/**
 * Async wrapper over src/lib/db/orders.ts (the real `orders`/`order_items`/
 * `payments` tables), translating snake_case rows to this module's existing
 * camelCase `Order` shape so every call site keeps the same function names
 * and return types it always had, just awaited. See db/orders.ts's own
 * comment for why every read/write here goes through the service-role
 * client rather than the RLS-scoped one: this store never enforced access
 * control itself (its in-memory predecessor couldn't have), and every call
 * site already does its own authorization in application code.
 */

function toAddress(json: unknown): OrderAddress {
  return json as OrderAddress;
}

/** `items: []` is valid here — see updateOrder()'s own note on why its patches don't need a real items fetch. */
function fromRow(row: OrderWithItems): Order {
  const lines: OrderLineItem[] = row.items.map((item) => ({
    productId: item.product_id ?? "",
    slug: "",
    sku: item.sku,
    name: item.name,
    image: item.image ?? "",
    variantLabel: item.variant_label ?? undefined,
    unitPrice: item.unit_price,
    quantity: item.quantity,
    lineTotal: item.line_total,
  }));

  return {
    id: row.id,
    orderNumber: row.order_number,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    isGuest: row.is_guest,
    userId: row.user_id ?? undefined,
    lines,
    couponCode: row.coupon_code ?? undefined,
    deliveryAddress: toAddress(row.delivery_address),
    billingAddress: toAddress(row.billing_address),
    deliveryMethodId: row.delivery_method_id,
    deliveryLabel: row.delivery_label,
    estimatedDeliveryEarliest: row.estimated_delivery_earliest ?? "",
    estimatedDeliveryLatest: row.estimated_delivery_latest ?? "",
    shippingNotes: row.shipping_notes ?? undefined,
    giftMessage: row.gift_message ?? undefined,
    marketingConsent: row.marketing_consent,
    subtotal: row.subtotal,
    discountAmount: row.discount_amount,
    deliveryFee: row.delivery_fee,
    taxAmount: row.tax_amount,
    total: row.total,
    paymentMethod: row.payment_method,
    paymentReference: row.payment_reference ?? undefined,
    paymentRedirectUrl: row.payment_redirect_url ?? undefined,
    trackingCarrier: row.tracking_carrier ?? undefined,
    trackingNumber: row.tracking_number ?? undefined,
    trackingUrl: row.tracking_url ?? undefined,
    cancelledReason: row.cancelled_reason ?? undefined,
    refundAmount: row.refund_amount ?? undefined,
    refundReason: row.refund_reason ?? undefined,
    refundedAt: row.refunded_at ?? undefined,
  };
}

// The daily order-number sequence is still an in-process counter — a known
// gap for a multi-instance deployment (two instances could each hand out
// the same sequence number at the same moment), flagged rather than solved
// here. It's a much smaller guarantee than idempotency: a genuine
// createOrder() retry (double-click, network replay) is now handled
// correctly regardless, via the DB's own `idempotency_key` UNIQUE
// constraint (see createOrderServerSide's existing-order check) rather
// than this counter.
let counterDate = "";
let dailyCounter = 0;

async function nextOrderNumber(): Promise<string> {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  if (counterDate !== datePart) {
    counterDate = datePart;
    dailyCounter = 0;
  }
  dailyCounter += 1;
  const settings = await getStoreSettings();
  return `${settings.orderNumberPrefix}-${datePart}-${String(dailyCounter).padStart(4, "0")}`;
}

export async function findOrderByIdempotencyKey(key: string): Promise<Order | undefined> {
  const row = await db.getOrderByIdempotencyKey(key);
  return row ? fromRow(row) : undefined;
}

/**
 * Creates an order — or, if an order already exists for this
 * `idempotencyKey` (a retried request, a double-click, a network replay),
 * returns the existing one unchanged instead of creating a duplicate.
 */
export async function createOrder(
  input: Omit<Order, "id" | "orderNumber" | "status" | "createdAt" | "updatedAt">,
): Promise<Order> {
  const orderNumber = await nextOrderNumber();

  const row = await db.createOrderServerSide(
    {
      order_number: orderNumber,
      idempotency_key: input.idempotencyKey,
      customer_email: input.customerEmail,
      customer_name: input.customerName,
      is_guest: input.isGuest,
      user_id: input.userId ?? null,
      coupon_code: input.couponCode ?? null,
      delivery_address: input.deliveryAddress as unknown as Database["public"]["Tables"]["orders"]["Insert"]["delivery_address"],
      billing_address: input.billingAddress as unknown as Database["public"]["Tables"]["orders"]["Insert"]["billing_address"],
      delivery_method_id: input.deliveryMethodId,
      delivery_label: input.deliveryLabel,
      estimated_delivery_earliest: input.estimatedDeliveryEarliest || null,
      estimated_delivery_latest: input.estimatedDeliveryLatest || null,
      shipping_notes: input.shippingNotes ?? null,
      gift_message: input.giftMessage ?? null,
      marketing_consent: input.marketingConsent,
      subtotal: input.subtotal,
      discount_amount: input.discountAmount,
      delivery_fee: input.deliveryFee,
      tax_amount: input.taxAmount,
      total: input.total,
      payment_method: input.paymentMethod,
    },
    input.lines.map((line) => ({
      product_id: line.productId || null,
      sku: line.sku,
      name: line.name,
      image: line.image,
      variant_label: line.variantLabel ?? null,
      unit_price: line.unitPrice,
      quantity: line.quantity,
      line_total: line.lineTotal,
    })),
  );

  return fromRow(row);
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | undefined> {
  const row = await db.getOrderByNumber(orderNumber);
  return row ? fromRow(row) : undefined;
}

export async function getOrderByPaymentReference(reference: string): Promise<Order | undefined> {
  const row = await db.getOrderByPaymentReference(reference);
  return row ? fromRow(row) : undefined;
}

/** All orders placed by a signed-in customer, most recent first. */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  const rows = await db.listOrdersByUserId(userId);
  return rows.map(fromRow);
}

/** Every order, most recent first — the admin order list (/admin/orders) and cross-store safety checks (e.g. refusing to delete a product that appears in past orders) read from this. */
export async function getAllOrders(): Promise<Order[]> {
  const rows = await db.listAllOrders();
  return rows.map(fromRow);
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
export async function linkGuestOrdersToUser(email: string, userId: string): Promise<number> {
  return db.linkGuestOrdersToUser(email.trim(), userId);
}

export async function updateOrder(
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
): Promise<Order | undefined> {
  const row = await db.updateOrder(orderNumber, {
    status: patch.status,
    payment_reference: patch.paymentReference,
    payment_redirect_url: patch.paymentRedirectUrl,
    tracking_carrier: patch.trackingCarrier,
    tracking_number: patch.trackingNumber,
    tracking_url: patch.trackingUrl,
    cancelled_reason: patch.cancelledReason,
    refund_amount: patch.refundAmount,
    refund_reason: patch.refundReason,
    refunded_at: patch.refundedAt,
  });
  // updateOrder() patches fields that never touch line items, so the
  // caller-visible Order it returns doesn't need a real items fetch —
  // every existing call site (admin routes, checkout, webhook) already
  // has its own copy of `lines` from an earlier read where it needs one.
  return fromRow({ ...row, items: [] });
}

export async function setOrderStatus(orderNumber: string, status: OrderStatus): Promise<Order | undefined> {
  return updateOrder(orderNumber, { status });
}

export async function setOrderTracking(
  orderNumber: string,
  tracking: { trackingCarrier: string; trackingNumber: string; trackingUrl?: string },
): Promise<Order | undefined> {
  return updateOrder(orderNumber, tracking);
}

export async function cancelOrder(orderNumber: string, reason?: string): Promise<Order | undefined> {
  return updateOrder(orderNumber, { status: "cancelled", cancelledReason: reason });
}

export async function recordOrderRefund(
  orderNumber: string,
  refund: { amount: number; reason?: string },
): Promise<Order | undefined> {
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
export async function listAdminOrders(filters?: AdminOrderFilters): Promise<Order[]> {
  const rows = await db.listAdminOrders(filters);
  return rows.map(fromRow);
}

/**
 * Claims a webhook event exactly once via the `payments` table's unique
 * `processed_webhook_event_id` column — see db/orders.ts's claimWebhookEvent
 * for the atomicity guarantee this replaces the in-memory Set with.
 */
export async function claimWebhookEvent(params: {
  orderId: string;
  provider: PaymentMethodId;
  eventKey: string;
  amount: number;
  status: Database["public"]["Enums"]["payment_status"];
  providerReference?: string;
}): Promise<boolean> {
  return db.claimWebhookEvent(params);
}
