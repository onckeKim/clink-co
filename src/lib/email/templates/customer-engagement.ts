import "server-only";
import type { StoreSettings } from "@/types/settings";
import { siteConfig } from "@/config/site";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/orders/types";
import { renderEmailHtml, renderEmailText } from "../layout";
import { heading, paragraph, paragraphText, ctaButton, ctaButtonText, productTile, productTileText, divider, dividerText } from "../components";
import type { EmailContent } from "../types";

export interface EmailProductRef {
  name: string;
  image?: string;
  price: number;
  slug: string;
}

function productUrl(product: EmailProductRef): string {
  return `${siteConfig.url}/products/${product.slug}`;
}

/**
 * Back-in-stock / wishlist reminder / abandoned cart are all classified
 * "marketing": none of them is required to complete a transaction already
 * in progress, so each one requires an unsubscribeUrl (enforced by
 * sendTransactionalEmail() refusing to send a marketing email without
 * one) and is only ever sent to a customer with marketing_consent — see
 * src/lib/email/abandoned-cart.ts for where that check actually happens.
 */

export function backInStockTemplate(data: { firstName: string; product: EmailProductRef; unsubscribeUrl: string }, settings: StoreSettings): EmailContent {
  const subject = `Back in stock: ${data.product.name}`;
  const previewText = `${data.product.name} is back — while it lasts.`;
  const bodyHtml = [
    heading(`It's back, ${data.firstName}`),
    paragraph(`${data.product.name} is back in stock. It sold through quickly last time, so if you've been waiting, now's a good moment.`),
    productTile({ ...data.product, href: productUrl(data.product) }),
    ctaButton("Shop Now", productUrl(data.product)),
  ].join("");
  const bodyText = [
    `It's back, ${data.firstName}`,
    paragraphText(`${data.product.name} is back in stock. It sold through quickly last time, so if you've been waiting, now's a good moment.`),
    productTileText({ ...data.product, href: productUrl(data.product) }),
    ctaButtonText("Shop Now", productUrl(data.product)),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "marketing", unsubscribeUrl: data.unsubscribeUrl }, settings),
    text: renderEmailText({ bodyText, category: "marketing", unsubscribeUrl: data.unsubscribeUrl }, settings),
  };
}

export function wishlistReminderTemplate(data: { firstName: string; products: EmailProductRef[]; unsubscribeUrl: string }, settings: StoreSettings): EmailContent {
  const subject = "Your wishlist is waiting";
  const previewText = `${data.products.length} saved piece${data.products.length === 1 ? "" : "s"} still up for grabs.`;
  const bodyHtml = [
    heading(`Still thinking it over, ${data.firstName}?`),
    paragraph("The pieces you saved are still here — a few of them are worth another look."),
    data.products.map((p) => productTile({ ...p, href: productUrl(p) })).join(""),
    ctaButton("View Your Wishlist", `${siteConfig.url}/wishlist`),
  ].join("");
  const bodyText = [
    `Still thinking it over, ${data.firstName}?`,
    paragraphText("The pieces you saved are still here — a few of them are worth another look."),
    data.products.map((p) => productTileText({ ...p, href: productUrl(p) })).join("\n\n"),
    ctaButtonText("View Your Wishlist", `${siteConfig.url}/wishlist`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "marketing", unsubscribeUrl: data.unsubscribeUrl }, settings),
    text: renderEmailText({ bodyText, category: "marketing", unsubscribeUrl: data.unsubscribeUrl }, settings),
  };
}

export function abandonedCartReminderTemplate(
  data: {
    firstName: string;
    products: EmailProductRef[];
    cartTotal: number;
    unsubscribeUrl: string;
  },
  settings: StoreSettings,
): EmailContent {
  const subject = "You left something behind";
  const previewText = "Your cart is still here, whenever you're ready.";
  const bodyHtml = [
    heading(`You left something behind, ${data.firstName}`),
    paragraph("Your cart is still saved — here's what's in it."),
    data.products.map((p) => productTile({ ...p, href: productUrl(p) })).join(""),
    paragraph(`Cart total: ${formatPrice(data.cartTotal)}`),
    ctaButton("Return to Your Cart", `${siteConfig.url}/cart`),
  ].join("");
  const bodyText = [
    `You left something behind, ${data.firstName}`,
    paragraphText("Your cart is still saved — here's what's in it."),
    data.products.map((p) => productTileText({ ...p, href: productUrl(p) })).join("\n\n"),
    `Cart total: ${formatPrice(data.cartTotal)}`,
    ctaButtonText("Return to Your Cart", `${siteConfig.url}/cart`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "marketing", unsubscribeUrl: data.unsubscribeUrl }, settings),
    text: renderEmailText({ bodyText, category: "marketing", unsubscribeUrl: data.unsubscribeUrl }, settings),
  };
}

/** Transactional, not marketing: this is a direct follow-up to a purchase the customer already made, not a promotional message — so no marketing consent or unsubscribe link is required, same reasoning as an order-status email. */
export function reviewRequestTemplate(order: Order, settings: StoreSettings): EmailContent {
  const firstName = order.customerName.split(" ")[0] || order.customerName;
  const subject = "How are you enjoying your order?";
  const previewText = "We'd love to hear what you think.";
  const bodyHtml = [
    heading(`How's everything, ${firstName}?`),
    paragraph(`It's been a little while since order ${order.orderNumber} arrived. We'd love to hear what you think — a quick review helps other customers and means a lot to our small team.`),
    divider(),
    order.lines
      .slice(0, 3)
      .map((line) => productTile({ name: line.name, image: line.image, price: line.unitPrice, href: `${siteConfig.url}/products/${line.slug}#reviews` }))
      .join(""),
    ctaButton("Leave a Review", `${siteConfig.url}/account/orders/${order.orderNumber}`),
  ].join("");
  const bodyText = [
    `How's everything, ${firstName}?`,
    paragraphText(`It's been a little while since order ${order.orderNumber} arrived. We'd love to hear what you think — a quick review helps other customers and means a lot to our small team.`),
    dividerText(),
    ctaButtonText("Leave a Review", `${siteConfig.url}/account/orders/${order.orderNumber}`),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }, settings),
    text: renderEmailText({ bodyText, category: "transactional" }, settings),
  };
}
