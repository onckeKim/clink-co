import "server-only";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/orders/types";
import type { ReturnReason } from "@/lib/account/returns-store";
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

/**
 * Staff-facing notifications. These go to internal addresses
 * (getStoreSettings().orderNotificationEmail, or a specific staff member's
 * email), so they can be more operationally detailed than a customer email
 * — a payment provider reference or a customer's delivery address is fine
 * here. What they still never include: the raw provider webhook payload
 * (payments.raw_response — see supabase/README.md's security decisions),
 * any card/account number, or a customer's password/reset token.
 */

const REASON_LABELS: Record<ReturnReason, string> = {
  "changed-mind": "Changed my mind",
  damaged: "Item arrived damaged",
  "wrong-item": "Received the wrong item",
  "not-as-described": "Not as described",
  other: "Other",
};

export function newOrderAdminTemplate(order: Order): EmailContent {
  const subject = `New order: ${order.orderNumber}`;
  const previewText = `${order.customerName} · ${formatPrice(order.total)}`;
  const bodyHtml = [
    heading(`New order — ${order.orderNumber}`),
    paragraph(`${order.customerName} (${order.customerEmail}) placed a new order.`),
    orderSummaryTable(order),
    paragraph(`Payment method: ${order.paymentMethod}${order.paymentReference ? ` — ref ${order.paymentReference}` : ""}`),
    order.giftMessage ? calloutBox(`<strong>Gift message:</strong> "${order.giftMessage}"`) : "",
    order.shippingNotes ? calloutBox(`<strong>Shipping notes:</strong> ${order.shippingNotes}`) : "",
    divider(),
    addressBlock("Deliver to", order.deliveryAddress),
    ctaButton("View in Admin", `${siteConfig.url}/admin/orders/${order.orderNumber}`),
  ].join("");
  const bodyText = [
    `New order — ${order.orderNumber}`,
    paragraphText(`${order.customerName} (${order.customerEmail}) placed a new order.`),
    orderSummaryText(order),
    `Payment method: ${order.paymentMethod}${order.paymentReference ? ` — ref ${order.paymentReference}` : ""}`,
    order.giftMessage ? calloutBoxText(`Gift message: "${order.giftMessage}"`) : "",
    order.shippingNotes ? calloutBoxText(`Shipping notes: ${order.shippingNotes}`) : "",
    dividerText(),
    addressText("Deliver to", order.deliveryAddress),
    ctaButtonText("View in Admin", `${siteConfig.url}/admin/orders/${order.orderNumber}`),
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

export function paymentFailureAdminTemplate(order: Order): EmailContent {
  const subject = `Payment failed: ${order.orderNumber}`;
  const previewText = `${order.customerName}'s payment for ${formatPrice(order.total)} failed.`;
  const bodyHtml = [
    heading(`Payment failed — ${order.orderNumber}`),
    paragraph(`${order.customerName} (${order.customerEmail})'s payment of ${formatPrice(order.total)} via ${order.paymentMethod} failed.`),
    calloutBox("The customer has been notified and can retry from their order confirmation link. No further action is usually needed unless this repeats.", "warning"),
    ctaButton("View in Admin", `${siteConfig.url}/admin/orders/${order.orderNumber}`),
  ].join("");
  const bodyText = [
    `Payment failed — ${order.orderNumber}`,
    paragraphText(`${order.customerName} (${order.customerEmail})'s payment of ${formatPrice(order.total)} via ${order.paymentMethod} failed.`),
    calloutBoxText("The customer has been notified and can retry from their order confirmation link."),
    ctaButtonText("View in Admin", `${siteConfig.url}/admin/orders/${order.orderNumber}`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export interface StockAlertProduct {
  id: string;
  name: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold: number;
}

export function lowStockAdminTemplate(product: StockAlertProduct): EmailContent {
  const subject = `Low stock: ${product.name}`;
  const previewText = `${product.stockQuantity} left — below the ${product.lowStockThreshold} threshold.`;
  const bodyHtml = [
    heading("Low stock warning"),
    paragraph(`${product.name} (SKU ${product.sku}) has ${product.stockQuantity} unit${product.stockQuantity === 1 ? "" : "s"} left — at or below its threshold of ${product.lowStockThreshold}.`),
    ctaButton("Manage Product", `${siteConfig.url}/admin/products/${product.id}`),
  ].join("");
  const bodyText = [
    "Low stock warning",
    paragraphText(`${product.name} (SKU ${product.sku}) has ${product.stockQuantity} unit${product.stockQuantity === 1 ? "" : "s"} left — at or below its threshold of ${product.lowStockThreshold}.`),
    ctaButtonText("Manage Product", `${siteConfig.url}/admin/products/${product.id}`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function outOfStockAdminTemplate(product: Pick<StockAlertProduct, "id" | "name" | "sku">): EmailContent {
  const subject = `Out of stock: ${product.name}`;
  const previewText = "This product just sold out.";
  const bodyHtml = [
    heading("Out of stock"),
    calloutBox(`<strong>${product.name}</strong> (SKU ${product.sku}) is now out of stock.`, "error"),
    paragraph("It's been automatically hidden from search/listing results as a discontinued-style item until restocked. Update its inventory once new stock arrives."),
    ctaButton("Manage Product", `${siteConfig.url}/admin/products/${product.id}`),
  ].join("");
  const bodyText = [
    "Out of stock",
    calloutBoxText(`${product.name} (SKU ${product.sku}) is now out of stock.`),
    paragraphText("Update its inventory once new stock arrives."),
    ctaButtonText("Manage Product", `${siteConfig.url}/admin/products/${product.id}`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function returnRequestAdminTemplate(order: Order, reason: ReturnReason, notes?: string): EmailContent {
  const subject = `Return requested: ${order.orderNumber}`;
  const previewText = `${order.customerName} requested a return.`;
  const bodyHtml = [
    heading("Return request"),
    paragraph(`${order.customerName} (${order.customerEmail}) requested a return for order ${order.orderNumber}.`),
    calloutBox(`<strong>Reason:</strong> ${REASON_LABELS[reason]}${notes ? `<br /><strong>Notes:</strong> ${notes}` : ""}`),
    ctaButton("Review in Admin", `${siteConfig.url}/admin/orders/${order.orderNumber}`),
  ].join("");
  const bodyText = [
    "Return request",
    paragraphText(`${order.customerName} (${order.customerEmail}) requested a return for order ${order.orderNumber}.`),
    calloutBoxText(`Reason: ${REASON_LABELS[reason]}${notes ? ` | Notes: ${notes}` : ""}`),
    ctaButtonText("Review in Admin", `${siteConfig.url}/admin/orders/${order.orderNumber}`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export interface ContactSubmission {
  name: string;
  email: string;
  subject?: string;
  message: string;
}

export function contactFormAdminTemplate(submission: ContactSubmission): EmailContent {
  const subject = `Contact form: ${submission.subject || "New message"}`;
  const previewText = `${submission.name} sent a message.`;
  const bodyHtml = [
    heading("New contact form submission"),
    paragraph(`From ${submission.name} (${submission.email})${submission.subject ? ` — "${submission.subject}"` : ""}`),
    calloutBox(submission.message.replace(/\n/g, "<br />")),
    ctaButton("Reply by Email", `mailto:${submission.email}`),
  ].join("");
  const bodyText = [
    "New contact form submission",
    paragraphText(`From ${submission.name} (${submission.email})${submission.subject ? ` — "${submission.subject}"` : ""}`),
    calloutBoxText(submission.message),
    ctaButtonText("Reply by Email", `mailto:${submission.email}`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export interface NewReviewNotification {
  productName: string;
  productSlug: string;
  customerName: string;
  rating: number;
  title?: string;
  body: string;
}

export function newReviewAdminTemplate(review: NewReviewNotification): EmailContent {
  const subject = `New review to moderate: ${review.productName}`;
  const previewText = `${review.customerName} left a ${review.rating}-star review.`;
  const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
  const bodyHtml = [
    heading("New review awaiting moderation"),
    paragraph(`${review.customerName} left a review on ${review.productName}.`),
    calloutBox(
      `<strong>${stars}</strong>${review.title ? `<br /><strong>${review.title}</strong>` : ""}<br />${review.body.replace(/\n/g, "<br />")}`,
    ),
    ctaButton("View Product Page", `${siteConfig.url}/products/${review.productSlug}#reviews`),
  ].join("");
  const bodyText = [
    "New review awaiting moderation",
    paragraphText(`${review.customerName} left a review on ${review.productName}.`),
    calloutBoxText(`${stars}${review.title ? ` — ${review.title}` : ""}\n${review.body}`),
    ctaButtonText("View Product Page", `${siteConfig.url}/products/${review.productSlug}#reviews`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}
