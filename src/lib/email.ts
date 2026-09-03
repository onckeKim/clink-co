import type { Order } from "@/lib/orders/types";
import { siteConfig } from "@/config/site";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { formatPrice } from "@/lib/utils";

const RESEND_API_URL = "https://api.resend.com/emails";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends transactional email via Resend's REST API directly (no SDK
 * dependency needed for one endpoint) when RESEND_API_KEY is set;
 * otherwise logs what would have been sent to the server console — the
 * same simulate-rather-than-fake-success pattern
 * src/components/layout/NewsletterForm.tsx already uses for its signup
 * call. Never throws: a failed or unconfigured email send shouldn't fail
 * the order that triggered it.
 */
async function sendEmail({ to, subject, html }: SendEmailInput): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log(`[email:not-configured] Would send "${subject}" to ${to}`);
    return { sent: false, reason: "RESEND_API_KEY is not set" };
  }

  try {
    const fromHost = (() => {
      try {
        return new URL(siteConfig.url).hostname;
      } catch {
        return "clinkandco.com";
      }
    })();
    const settings = getStoreSettings();

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `${settings.emailSenderName} <${settings.emailSenderLocalPart}@${fromHost}>`,
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      console.error(`[email:failed] ${response.status} sending "${subject}" to ${to}: ${await response.text()}`);
      return { sent: false, reason: `Resend API error ${response.status}` };
    }
    return { sent: true };
  } catch (error) {
    console.error("[email:failed]", error);
    return { sent: false, reason: error instanceof Error ? error.message : "Unknown error" };
  }
}

function orderLinesHtml(order: Order): string {
  return order.lines
    .map(
      (line) => `
      <tr>
        <td style="padding:6px 0;">${line.name}${line.variantLabel ? ` — ${line.variantLabel}` : ""} × ${line.quantity}</td>
        <td style="padding:6px 0; text-align:right;">${formatPrice(line.lineTotal)}</td>
      </tr>`,
    )
    .join("");
}

function orderSummaryHtml(order: Order): string {
  return `
    <table style="width:100%; border-collapse:collapse; font-family:sans-serif; font-size:14px; color:#1C1C1A;">
      ${orderLinesHtml(order)}
      <tr><td style="padding-top:10px;">Subtotal</td><td style="text-align:right; padding-top:10px;">${formatPrice(order.subtotal)}</td></tr>
      ${
        order.discountAmount > 0
          ? `<tr><td>Discount${order.couponCode ? ` (${order.couponCode})` : ""}</td><td style="text-align:right;">-${formatPrice(order.discountAmount)}</td></tr>`
          : ""
      }
      <tr><td>Delivery (${order.deliveryLabel})</td><td style="text-align:right;">${order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</td></tr>
      <tr><td style="font-weight:600; padding-top:8px;">Total</td><td style="text-align:right; font-weight:600; padding-top:8px;">${formatPrice(order.total)}</td></tr>
    </table>`;
}

export async function sendOrderConfirmationEmail(order: Order) {
  const firstName = order.customerName.split(" ")[0] || order.customerName;
  const html = `
    <div style="font-family:sans-serif; max-width:520px; margin:0 auto;">
      <h1 style="font-size:20px;">Thank you for your order, ${firstName}</h1>
      <p>Your order <strong>${order.orderNumber}</strong> is confirmed.</p>
      ${orderSummaryHtml(order)}
      <p style="margin-top:16px;">
        Estimated delivery: ${new Date(order.estimatedDeliveryEarliest).toLocaleDateString("en-ZA")} –
        ${new Date(order.estimatedDeliveryLatest).toLocaleDateString("en-ZA")}
      </p>
      ${
        order.paymentMethod === "eft"
          ? `<p>Please use reference <strong>${order.orderNumber}</strong> when making your bank transfer — your order ships once payment is confirmed.</p>`
          : ""
      }
    </div>`;

  return sendEmail({ to: order.customerEmail, subject: `Order confirmed — ${order.orderNumber}`, html });
}

export async function sendAdminOrderNotification(order: Order) {
  const address = order.deliveryAddress;
  const html = `
    <div style="font-family:sans-serif; max-width:520px; margin:0 auto;">
      <h1 style="font-size:18px;">New order ${order.orderNumber}</h1>
      <p>${order.customerName} &middot; ${order.customerEmail}</p>
      ${orderSummaryHtml(order)}
      <p>Payment method: ${order.paymentMethod}${order.paymentReference ? ` (ref: ${order.paymentReference})` : ""}</p>
      <p>Deliver to: ${address.line1}, ${address.suburb}, ${address.city}, ${address.province} ${address.postalCode}</p>
      ${order.giftMessage ? `<p>Gift message: "${order.giftMessage}"</p>` : ""}
      ${order.shippingNotes ? `<p>Shipping notes: ${order.shippingNotes}</p>` : ""}
    </div>`;

  return sendEmail({ to: getStoreSettings().orderNotificationEmail, subject: `New order: ${order.orderNumber}`, html });
}
