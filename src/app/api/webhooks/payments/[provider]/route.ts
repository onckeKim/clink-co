import { NextResponse } from "next/server";
import { getPaymentProvider, paymentProviders } from "@/lib/payments";
import {
  getOrderByNumber,
  getOrderByPaymentReference,
  hasProcessedWebhookEvent,
  markWebhookEventProcessed,
  setOrderStatus,
} from "@/lib/orders/store";
import { sendOrderConfirmationEmail } from "@/lib/email";
import type { NormalizedPaymentStatus } from "@/lib/payments/types";
import type { OrderStatus, PaymentMethodId } from "@/lib/orders/types";

function headersToRecord(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  headers.forEach((value, key) => {
    record[key.toLowerCase()] = value;
  });
  return record;
}

function mapStatus(status: NormalizedPaymentStatus): OrderStatus | null {
  switch (status) {
    case "paid":
      return "paid";
    case "failed":
      return "payment_failed";
    case "cancelled":
      return "cancelled";
    default:
      return null; // "pending" — no status change yet, just an interim gateway notification.
  }
}

/**
 * Server-to-server payment notifications land here. Every gateway calls
 * this differently, but the shape is the same: verify the payload really
 * came from the provider (parseWebhook returns null otherwise), then apply
 * it idempotently — a redelivered webhook (every provider retries on a
 * non-200 response) must never re-trigger a status flip or a duplicate
 * confirmation email.
 */
export async function POST(request: Request, { params }: RouteContext<"/api/webhooks/payments/[provider]">) {
  const { provider: providerId } = await params;
  if (!(providerId in paymentProviders)) {
    return NextResponse.json({ error: "Unknown payment provider." }, { status: 404 });
  }

  const provider = getPaymentProvider(providerId as PaymentMethodId);
  const rawBody = await request.text();
  const headers = headersToRecord(request.headers);

  const event = provider.parseWebhook(rawBody, headers);
  if (!event) {
    return NextResponse.json({ error: "Invalid or unverifiable webhook payload." }, { status: 400 });
  }

  const eventKey = `${provider.id}:${event.eventId}`;
  if (hasProcessedWebhookEvent(eventKey)) {
    return NextResponse.json({ ok: true, alreadyProcessed: true });
  }

  const order = event.orderNumber
    ? getOrderByNumber(event.orderNumber)
    : getOrderByPaymentReference(event.providerReference);

  if (!order) {
    return NextResponse.json({ error: "No matching order for this payment reference." }, { status: 404 });
  }

  const nextStatus = mapStatus(event.status);
  if (nextStatus) {
    const wasAlreadyPaid = order.status === "paid";
    setOrderStatus(order.orderNumber, nextStatus);
    if (nextStatus === "paid" && !wasAlreadyPaid) {
      void sendOrderConfirmationEmail(order);
    }
  }

  markWebhookEventProcessed(eventKey);
  return NextResponse.json({ ok: true });
}
