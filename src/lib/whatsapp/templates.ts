import type { Order } from "@/lib/orders/types";
import { formatPrice } from "@/lib/utils";
import type { WhatsAppMessage } from "./types";

/**
 * Each of these maps to a template that must be created and approved in
 * Meta Business Manager under the exact same name before it will send
 * anything for real — see provider.ts's comment on the 24-hour window.
 * The `body`/`templateParams` here are the reference copy to register
 * those templates from, not something this app can just start sending
 * with no further setup.
 */

export function orderConfirmationWhatsAppMessage(order: Order, phone: string): WhatsAppMessage {
  const firstName = order.customerName.split(" ")[0] || order.customerName;
  return {
    to: { phone, name: order.customerName },
    templateName: "order_confirmation",
    templateParams: [firstName, order.orderNumber, formatPrice(order.total)],
    body: `Hi ${firstName}, your Clink & Co order ${order.orderNumber} (${formatPrice(order.total)}) is confirmed. We'll message you again once it ships.`,
  };
}

export function shippingUpdateWhatsAppMessage(order: Order, phone: string): WhatsAppMessage {
  const firstName = order.customerName.split(" ")[0] || order.customerName;
  const tracking = order.trackingNumber ? ` Tracking: ${order.trackingNumber}` : "";
  return {
    to: { phone, name: order.customerName },
    templateName: "shipping_update",
    templateParams: [firstName, order.orderNumber, order.trackingCarrier ?? "our courier", order.trackingNumber ?? ""],
    body: `Hi ${firstName}, order ${order.orderNumber} is on its way with ${order.trackingCarrier ?? "our courier"}.${tracking}`,
  };
}

/**
 * Support messages are typically a live agent replying inside the 24-hour
 * customer-service window (a free-text reply, not a template) — this
 * builder exists for the one templated case: a business-initiated support
 * follow-up outside that window (e.g. "we saw your return request").
 */
export function customerSupportWhatsAppMessage(input: { name: string; phone: string; message: string }): WhatsAppMessage {
  return {
    to: { phone: input.phone, name: input.name },
    templateName: "customer_support_followup",
    templateParams: [input.name, input.message],
    body: input.message,
  };
}
