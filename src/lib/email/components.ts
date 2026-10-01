import "server-only";
import { formatPrice } from "@/lib/utils";
import type { Order, OrderAddress, OrderLineItem } from "@/lib/orders/types";
import { COLORS, escapeHtml } from "./layout";

const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

/**
 * Reusable content blocks every template composes from — each one returns
 * plain HTML (to slot into layout.ts's bodyHtml) and has a text-mode
 * counterpart with the matching name suffixed `Text`, so a template's
 * plain-text version never drifts far in structure from its HTML one.
 */

export function heading(text: string): string {
  return `<h1 style="margin:0 0 16px; font-family:${FONT_STACK}; font-size:22px; line-height:30px; font-weight:600; color:${COLORS.charcoal};">${escapeHtml(text)}</h1>`;
}

export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px; font-family:${FONT_STACK}; font-size:15px; line-height:24px; color:${COLORS.charcoal};">${escapeHtml(text)}</p>`;
}

export function paragraphText(text: string): string {
  return text;
}

export function divider(): string {
  return `<hr style="border:none; border-top:1px solid ${COLORS.softGrey}; margin:24px 0;" />`;
}

export function dividerText(): string {
  return "----------------------------------------";
}

/** A "bulletproof" table-cell button — the standard cross-client-safe pattern (a padded, colored <td> wrapping the link) since border-radius/box-shadow on an <a> alone renders inconsistently in Outlook's Word engine. */
export function ctaButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
      <tr>
        <td class="cco-cta" style="background:${COLORS.champagne}; border-radius:999px;">
          <a href="${escapeHtml(href)}" style="display:inline-block; padding:14px 32px; font-family:${FONT_STACK}; font-size:14px; font-weight:600; letter-spacing:0.3px; color:${COLORS.warmWhite}; text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

export function ctaButtonText(label: string, href: string): string {
  return `${label}: ${href}`;
}

export type CalloutVariant = "default" | "success" | "warning" | "error";

const CALLOUT_STYLES: Record<CalloutVariant, { bg: string; border: string; text: string }> = {
  default: { bg: COLORS.porcelain, border: COLORS.softGrey, text: COLORS.charcoal },
  success: { bg: "#eaf4ee", border: COLORS.success, text: COLORS.success },
  warning: { bg: "#faf1e6", border: COLORS.champagne, text: "#7a5f2e" },
  error: { bg: "#fbebe9", border: COLORS.error, text: COLORS.error },
};

export function calloutBox(html: string, variant: CalloutVariant = "default"): string {
  const style = CALLOUT_STYLES[variant];
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:${style.bg}; border:1px solid ${style.border}; border-radius:10px;">
      <tr><td style="padding:16px 18px; font-family:${FONT_STACK}; font-size:14px; line-height:22px; color:${style.text};">${html}</td></tr>
    </table>`;
}

export function calloutBoxText(text: string): string {
  return `[ ${text} ]`;
}

function orderLineRow(line: OrderLineItem): string {
  return `
    <tr>
      <td style="padding:8px 0; font-family:${FONT_STACK}; font-size:14px; color:${COLORS.charcoal};">
        ${escapeHtml(line.name)}${line.variantLabel ? ` — ${escapeHtml(line.variantLabel)}` : ""}<br />
        <span style="color:${COLORS.stone}; font-size:12px;">Qty ${line.quantity} &middot; SKU ${escapeHtml(line.sku)}</span>
      </td>
      <td style="padding:8px 0; font-family:${FONT_STACK}; font-size:14px; color:${COLORS.charcoal}; text-align:right; white-space:nowrap;">${formatPrice(line.lineTotal)}</td>
    </tr>`;
}

function totalsRow(label: string, value: string, emphasize = false): string {
  return `
    <tr>
      <td style="padding-top:6px; font-family:${FONT_STACK}; font-size:${emphasize ? "15px" : "13px"}; font-weight:${emphasize ? "600" : "400"}; color:${emphasize ? COLORS.charcoal : COLORS.stone};">${label}</td>
      <td style="padding-top:6px; font-family:${FONT_STACK}; font-size:${emphasize ? "15px" : "13px"}; font-weight:${emphasize ? "600" : "400"}; color:${emphasize ? COLORS.charcoal : COLORS.stone}; text-align:right;">${value}</td>
    </tr>`;
}

/** Line items + totals for an order — reused by every order-lifecycle template so the numbers a customer sees are always assembled the same way. */
export function orderSummaryTable(order: Pick<Order, "lines" | "subtotal" | "discountAmount" | "couponCode" | "deliveryFee" | "deliveryLabel" | "taxAmount" | "total">): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      ${order.lines.map(orderLineRow).join("")}
      <tr><td colspan="2" style="padding-top:10px;"><div style="border-top:1px solid ${COLORS.softGrey};"></div></td></tr>
      ${totalsRow("Subtotal", formatPrice(order.subtotal))}
      ${
        order.discountAmount > 0
          ? totalsRow(`Discount${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}`, `-${formatPrice(order.discountAmount)}`)
          : ""
      }
      ${totalsRow(`Delivery (${escapeHtml(order.deliveryLabel)})`, order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee))}
      ${order.taxAmount > 0 ? totalsRow("VAT (included)", formatPrice(order.taxAmount)) : ""}
      ${totalsRow("Total", formatPrice(order.total), true)}
    </table>`;
}

export function orderSummaryText(order: Pick<Order, "lines" | "subtotal" | "discountAmount" | "couponCode" | "deliveryFee" | "deliveryLabel" | "taxAmount" | "total">): string {
  const lines = order.lines
    .map((line) => `  ${line.name}${line.variantLabel ? ` — ${line.variantLabel}` : ""} x${line.quantity}  ${formatPrice(line.lineTotal)}`)
    .join("\n");
  const discount = order.discountAmount > 0 ? `\nDiscount${order.couponCode ? ` (${order.couponCode})` : ""}: -${formatPrice(order.discountAmount)}` : "";
  return [
    lines,
    `Subtotal: ${formatPrice(order.subtotal)}${discount}`,
    `Delivery (${order.deliveryLabel}): ${order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}`,
    `Total: ${formatPrice(order.total)}`,
  ].join("\n");
}

export function addressBlock(label: string, address: OrderAddress): string {
  return `
    <p style="margin:0 0 16px; font-family:${FONT_STACK}; font-size:13px; line-height:20px; color:${COLORS.stone};">
      <strong style="color:${COLORS.charcoal};">${escapeHtml(label)}</strong><br />
      ${escapeHtml(address.fullName)}<br />
      ${escapeHtml(address.line1)}${address.line2 ? `, ${escapeHtml(address.line2)}` : ""}<br />
      ${escapeHtml(address.suburb)}, ${escapeHtml(address.city)}<br />
      ${escapeHtml(address.province)}, ${escapeHtml(address.postalCode)}
    </p>`;
}

export function addressText(label: string, address: OrderAddress): string {
  return [
    `${label}:`,
    address.fullName,
    `${address.line1}${address.line2 ? `, ${address.line2}` : ""}`,
    `${address.suburb}, ${address.city}`,
    `${address.province}, ${address.postalCode}`,
  ].join("\n");
}

/** A single product tile — used by back-in-stock/wishlist-reminder/review-request, where the email is "about" one product rather than a whole order. */
export function productTile(input: { name: string; image?: string; price: number; href: string }): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px; background:${COLORS.porcelain}; border-radius:10px;">
      <tr>
        ${
          input.image
            ? `<td width="96" style="padding:14px;"><img src="${escapeHtml(input.image)}" width="80" height="80" alt="${escapeHtml(input.name)}" style="display:block; border-radius:8px; background:${COLORS.softGrey};" /></td>`
            : ""
        }
        <td style="padding:14px ${input.image ? "14px 14px 0" : "14px"};">
          <p style="margin:0 0 4px; font-family:${FONT_STACK}; font-size:15px; font-weight:600; color:${COLORS.charcoal};">${escapeHtml(input.name)}</p>
          <p style="margin:0; font-family:${FONT_STACK}; font-size:14px; color:${COLORS.stone};">${formatPrice(input.price)}</p>
        </td>
      </tr>
    </table>`;
}

export function productTileText(input: { name: string; price: number; href: string }): string {
  return `${input.name} — ${formatPrice(input.price)}\n${input.href}`;
}
