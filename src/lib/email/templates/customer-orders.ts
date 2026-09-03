import "server-only";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/orders/types";
import { renderEmailHtml, renderEmailText } from "../layout";
import {
  heading,
  paragraph,
  paragraphText,
  ctaButton,
  ctaButtonText,
  calloutBox,
  calloutBoxText,
  orderSummaryTable,
  orderSummaryText,
  addressBlock,
  addressText,
  divider,
  dividerText,
} from "../components";
import type { EmailContent } from "../types";

/** Order-lifecycle templates — every one of these takes the order it's about and produces a self-contained email. Each is triggered from the point in the app where that state change actually happens; see src/lib/email.ts for the wiring. */

function firstName(order: Pick<Order, "customerName">): string {
  return order.customerName.split(" ")[0] || order.customerName;
}

function orderUrl(order: Pick<Order, "orderNumber">): string {
  return `${siteConfig.url}/account/orders/${order.orderNumber}`;
}

export function orderConfirmationTemplate(order: Order): EmailContent {
  const subject = `Order confirmed — ${order.orderNumber}`;
  const previewText = `We've got it — order ${order.orderNumber} is confirmed.`;
  const eftNote =
    order.paymentMethod === "eft"
      ? calloutBox(
          `Please use reference <strong>${order.orderNumber}</strong> when making your bank transfer — your order ships once payment is confirmed.`,
          "warning",
        )
      : "";
  const eftNoteText =
    order.paymentMethod === "eft"
      ? calloutBoxText(`Please use reference ${order.orderNumber} when making your bank transfer — your order ships once payment is confirmed.`)
      : "";

  const bodyHtml = [
    heading(`Thank you for your order, ${firstName(order)}`),
    paragraph(`Your order ${order.orderNumber} is confirmed. Here's a summary of what's on its way.`),
    orderSummaryTable(order),
    eftNote,
    paragraph(
      `Estimated delivery: ${formatDate(order.estimatedDeliveryEarliest)} – ${formatDate(order.estimatedDeliveryLatest)}`,
    ),
    ctaButton("View Your Order", orderUrl(order)),
    divider(),
    addressBlock("Delivery address", order.deliveryAddress),
  ].join("");

  const bodyText = [
    `Thank you for your order, ${firstName(order)}`,
    paragraphText(`Your order ${order.orderNumber} is confirmed. Here's a summary of what's on its way.`),
    orderSummaryText(order),
    eftNoteText,
    `Estimated delivery: ${formatDate(order.estimatedDeliveryEarliest)} – ${formatDate(order.estimatedDeliveryLatest)}`,
    ctaButtonText("View Your Order", orderUrl(order)),
    dividerText(),
    addressText("Delivery address", order.deliveryAddress),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function paymentReceivedTemplate(order: Order): EmailContent {
  const subject = `Payment received — ${order.orderNumber}`;
  const previewText = `We've received your payment of ${formatPrice(order.total)}.`;
  const bodyHtml = [
    heading(`Payment received, ${firstName(order)}`),
    paragraph(`We've received your payment of ${formatPrice(order.total)} for order ${order.orderNumber}. We're getting it ready now.`),
    orderSummaryTable(order),
    ctaButton("View Your Order", orderUrl(order)),
  ].join("");
  const bodyText = [
    `Payment received, ${firstName(order)}`,
    paragraphText(`We've received your payment of ${formatPrice(order.total)} for order ${order.orderNumber}. We're getting it ready now.`),
    orderSummaryText(order),
    ctaButtonText("View Your Order", orderUrl(order)),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function paymentFailedTemplate(order: Order): EmailContent {
  const subject = `We couldn't process your payment — ${order.orderNumber}`;
  const previewText = "Your payment didn't go through — no charge was made.";
  const retryUrl = `${siteConfig.url}/checkout/pay/${order.orderNumber}`;
  const bodyHtml = [
    heading(`We couldn't process your payment, ${firstName(order)}`),
    paragraph(`Your payment for order ${order.orderNumber} (${formatPrice(order.total)}) didn't go through. No amount has been charged.`),
    calloutBox("This can happen for a few reasons — an expired card, insufficient funds, or your bank declining the transaction. Your order is being held; try again below.", "error"),
    ctaButton("Retry Payment", retryUrl),
  ].join("");
  const bodyText = [
    `We couldn't process your payment, ${firstName(order)}`,
    paragraphText(`Your payment for order ${order.orderNumber} (${formatPrice(order.total)}) didn't go through. No amount has been charged.`),
    calloutBoxText("This can happen for a few reasons — an expired card, insufficient funds, or your bank declining the transaction. Your order is being held; try again below."),
    ctaButtonText("Retry Payment", retryUrl),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function orderProcessingTemplate(order: Order): EmailContent {
  const subject = `Your order is being prepared — ${order.orderNumber}`;
  const previewText = "Your order is being prepared for packing.";
  const bodyHtml = [
    heading(`Your order is being prepared, ${firstName(order)}`),
    paragraph(`Order ${order.orderNumber} is being picked and prepared in our studio — next stop, packing.`),
    ctaButton("View Your Order", orderUrl(order)),
  ].join("");
  const bodyText = [
    `Your order is being prepared, ${firstName(order)}`,
    paragraphText(`Order ${order.orderNumber} is being picked and prepared in our studio — next stop, packing.`),
    ctaButtonText("View Your Order", orderUrl(order)),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function orderPackedTemplate(order: Order): EmailContent {
  const subject = `Your order has been packed — ${order.orderNumber}`;
  const previewText = "Packed with care — ready for the courier.";
  const bodyHtml = [
    heading(`Your order is packed, ${firstName(order)}`),
    paragraph(`Order ${order.orderNumber} has been carefully packed and is ready for collection by our courier. You'll hear from us again the moment it ships.`),
    ctaButton("View Your Order", orderUrl(order)),
  ].join("");
  const bodyText = [
    `Your order is packed, ${firstName(order)}`,
    paragraphText(`Order ${order.orderNumber} has been carefully packed and is ready for collection by our courier. You'll hear from us again the moment it ships.`),
    ctaButtonText("View Your Order", orderUrl(order)),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function orderShippedTemplate(order: Order): EmailContent {
  const subject = `Your order is on its way — ${order.orderNumber}`;
  const previewText = order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "Your order has shipped.";
  const trackingBox = order.trackingNumber
    ? calloutBox(
        `<strong>Carrier:</strong> ${order.trackingCarrier ?? "Courier"}<br /><strong>Tracking number:</strong> ${order.trackingNumber}`,
      )
    : "";
  const trackingBoxText = order.trackingNumber
    ? calloutBoxText(`Carrier: ${order.trackingCarrier ?? "Courier"} | Tracking number: ${order.trackingNumber}`)
    : "";

  const bodyHtml = [
    heading(`Your order is on its way, ${firstName(order)}`),
    paragraph(`Order ${order.orderNumber} has shipped and is headed your way.`),
    trackingBox,
    ctaButton(order.trackingUrl ? "Track Your Order" : "View Your Order", order.trackingUrl || orderUrl(order)),
    paragraph(`Estimated delivery: ${formatDate(order.estimatedDeliveryEarliest)} – ${formatDate(order.estimatedDeliveryLatest)}`),
  ].join("");
  const bodyText = [
    `Your order is on its way, ${firstName(order)}`,
    paragraphText(`Order ${order.orderNumber} has shipped and is headed your way.`),
    trackingBoxText,
    ctaButtonText(order.trackingUrl ? "Track Your Order" : "View Your Order", order.trackingUrl || orderUrl(order)),
    `Estimated delivery: ${formatDate(order.estimatedDeliveryEarliest)} – ${formatDate(order.estimatedDeliveryLatest)}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function deliveryConfirmationTemplate(order: Order): EmailContent {
  const subject = `Delivered — ${order.orderNumber}`;
  const previewText = "Your order has arrived.";
  const bodyHtml = [
    heading(`Your order has been delivered, ${firstName(order)}`),
    paragraph(`Order ${order.orderNumber} has arrived. We hope it's everything you were hoping for.`),
    ctaButton("View Your Order", orderUrl(order)),
    paragraph("If anything arrived damaged or isn't quite right, our returns process is straightforward — just reach out."),
  ].join("");
  const bodyText = [
    `Your order has been delivered, ${firstName(order)}`,
    paragraphText(`Order ${order.orderNumber} has arrived. We hope it's everything you were hoping for.`),
    ctaButtonText("View Your Order", orderUrl(order)),
    paragraphText("If anything arrived damaged or isn't quite right, our returns process is straightforward — just reach out."),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function orderCancelledTemplate(order: Order): EmailContent {
  const subject = `Order cancelled — ${order.orderNumber}`;
  const previewText = "Your order has been cancelled.";
  const willRefund = order.status !== "pending_payment" && order.status !== "payment_failed";
  const bodyHtml = [
    heading(`Order ${order.orderNumber} has been cancelled`),
    paragraph(`Hi ${firstName(order)}, your order has been cancelled${order.cancelledReason ? `: ${order.cancelledReason}` : "."}`),
    willRefund
      ? calloutBox(`If payment had already been taken, a full refund of ${formatPrice(order.total)} will be processed to your original payment method — you'll receive a separate email once it's on its way.`, "success")
      : "",
    ctaButton("View Order Details", orderUrl(order)),
  ].join("");
  const bodyText = [
    `Order ${order.orderNumber} has been cancelled`,
    paragraphText(`Hi ${firstName(order)}, your order has been cancelled${order.cancelledReason ? `: ${order.cancelledReason}` : "."}`),
    willRefund ? calloutBoxText(`If payment had already been taken, a full refund of ${formatPrice(order.total)} will be processed to your original payment method.`) : "",
    ctaButtonText("View Order Details", orderUrl(order)),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function refundProcessedTemplate(order: Order): EmailContent {
  const amount = order.refundAmount ?? order.total;
  const subject = `Refund processed — ${order.orderNumber}`;
  const previewText = `A refund of ${formatPrice(amount)} is on its way.`;
  const bodyHtml = [
    heading(`Your refund has been processed, ${firstName(order)}`),
    paragraph(`We've processed a refund of ${formatPrice(amount)} for order ${order.orderNumber}${order.refundReason ? ` — ${order.refundReason}` : ""}.`),
    calloutBox("Refunds typically appear on your statement within 5–10 business days, depending on your bank or card provider.", "success"),
    ctaButton("View Order Details", orderUrl(order)),
  ].join("");
  const bodyText = [
    `Your refund has been processed, ${firstName(order)}`,
    paragraphText(`We've processed a refund of ${formatPrice(amount)} for order ${order.orderNumber}${order.refundReason ? ` — ${order.refundReason}` : ""}.`),
    calloutBoxText("Refunds typically appear on your statement within 5–10 business days, depending on your bank or card provider."),
    ctaButtonText("View Order Details", orderUrl(order)),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}
