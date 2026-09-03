"use client";

import { useConsentStore } from "@/store/consent-store";

/** A line item shaped for GA4/Meta/TikTok ecommerce events. */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
}

export type AnalyticsEvent =
  | { name: "product_viewed"; items: AnalyticsItem[]; currency: string }
  | { name: "product_searched"; searchTerm: string; resultCount?: number }
  | { name: "filter_used"; filterType: string; filterValue: string }
  | { name: "add_to_cart"; items: AnalyticsItem[]; currency: string; value: number }
  | { name: "remove_from_cart"; items: AnalyticsItem[]; currency: string; value: number }
  | { name: "add_to_wishlist"; items: AnalyticsItem[]; currency: string; value: number }
  | { name: "begin_checkout"; items: AnalyticsItem[]; currency: string; value: number }
  | { name: "add_delivery_information"; currency: string; value: number; shippingTier?: string }
  | { name: "add_payment_information"; currency: string; value: number; paymentType?: string }
  | { name: "purchase_completed"; transactionId: string; items: AnalyticsItem[]; currency: string; value: number; coupon?: string }
  | { name: "coupon_applied"; couponCode: string; discountAmount?: number }
  | { name: "newsletter_signup"; location: string }
  | { name: "contact_form_submitted"; category: string };

/** GA4's recommended-event vocabulary — https://support.google.com/analytics/answer/9267735 */
const GA4_EVENT_NAME: Record<AnalyticsEvent["name"], string> = {
  product_viewed: "view_item",
  product_searched: "search",
  filter_used: "filter_used",
  add_to_cart: "add_to_cart",
  remove_from_cart: "remove_from_cart",
  add_to_wishlist: "add_to_wishlist",
  begin_checkout: "begin_checkout",
  add_delivery_information: "add_shipping_info",
  add_payment_information: "add_payment_info",
  purchase_completed: "purchase",
  coupon_applied: "coupon_applied",
  newsletter_signup: "sign_up",
  contact_form_submitted: "generate_lead",
};

/** Meta Pixel's standard-event vocabulary — events with no clean standard equivalent fall back to trackCustom. */
const META_STANDARD_EVENT: Partial<Record<AnalyticsEvent["name"], string>> = {
  product_viewed: "ViewContent",
  product_searched: "Search",
  add_to_cart: "AddToCart",
  add_to_wishlist: "AddToWishlist",
  begin_checkout: "InitiateCheckout",
  add_payment_information: "AddPaymentInfo",
  purchase_completed: "Purchase",
  newsletter_signup: "CompleteRegistration",
  contact_form_submitted: "Lead",
};

/** TikTok Pixel's standard-event vocabulary. */
const TIKTOK_STANDARD_EVENT: Partial<Record<AnalyticsEvent["name"], string>> = {
  product_viewed: "ViewContent",
  product_searched: "Search",
  add_to_cart: "AddToCart",
  begin_checkout: "InitiateCheckout",
  add_payment_information: "AddPaymentInfo",
  purchase_completed: "CompletePayment",
  newsletter_signup: "CompleteRegistration",
  contact_form_submitted: "Contact",
};

function gaParams(event: AnalyticsEvent): Record<string, unknown> {
  switch (event.name) {
    case "product_viewed":
      return { currency: event.currency, value: event.items[0]?.price, items: event.items };
    case "product_searched":
      return { search_term: event.searchTerm };
    case "filter_used":
      return { filter_type: event.filterType, filter_value: event.filterValue };
    case "add_to_cart":
    case "remove_from_cart":
    case "add_to_wishlist":
    case "begin_checkout":
      return { currency: event.currency, value: event.value, items: event.items };
    case "add_delivery_information":
      return { currency: event.currency, value: event.value, shipping_tier: event.shippingTier };
    case "add_payment_information":
      return { currency: event.currency, value: event.value, payment_type: event.paymentType };
    case "purchase_completed":
      return {
        transaction_id: event.transactionId,
        currency: event.currency,
        value: event.value,
        coupon: event.coupon,
        items: event.items,
      };
    case "coupon_applied":
      return { coupon: event.couponCode, discount_amount: event.discountAmount };
    case "newsletter_signup":
      return { method: event.location };
    case "contact_form_submitted":
      return { form_category: event.category };
  }
}

function metaParams(event: AnalyticsEvent): Record<string, unknown> {
  switch (event.name) {
    case "product_viewed":
      return {
        content_ids: event.items.map((i) => i.item_id),
        content_name: event.items[0]?.item_name,
        currency: event.currency,
        value: event.items[0]?.price,
      };
    case "product_searched":
      return { search_string: event.searchTerm };
    case "add_to_cart":
    case "add_to_wishlist":
    case "begin_checkout":
      return {
        content_ids: event.items.map((i) => i.item_id),
        currency: event.currency,
        value: event.value,
      };
    case "add_payment_information":
      return { currency: event.currency, value: event.value };
    case "purchase_completed":
      return {
        content_ids: event.items.map((i) => i.item_id),
        currency: event.currency,
        value: event.value,
      };
    default:
      return {};
  }
}

function tiktokParams(event: AnalyticsEvent): Record<string, unknown> {
  switch (event.name) {
    case "product_viewed":
      return {
        contents: event.items.map((i) => ({ content_id: i.item_id, content_name: i.item_name })),
        currency: event.currency,
        value: event.items[0]?.price,
      };
    case "product_searched":
      return { query: event.searchTerm };
    case "add_to_cart":
    case "begin_checkout":
      return {
        contents: event.items.map((i) => ({ content_id: i.item_id, content_name: i.item_name, quantity: i.quantity })),
        currency: event.currency,
        value: event.value,
      };
    case "add_payment_information":
      return { currency: event.currency, value: event.value };
    case "purchase_completed":
      return {
        contents: event.items.map((i) => ({ content_id: i.item_id, content_name: i.item_name, quantity: i.quantity })),
        currency: event.currency,
        value: event.value,
      };
    default:
      return {};
  }
}

/**
 * Fires an analytics event to every configured, consented provider.
 * Consent is re-checked on every call (not cached) so a customer who
 * withdraws consent mid-session stops being tracked immediately — GA4 and
 * Clarity require "analytics" consent, the Meta and TikTok pixels require
 * "marketing" consent, matching the categories in the cookie banner.
 * Safe to call unconditionally from any call site: silently no-ops when a
 * provider isn't configured, hasn't loaded yet, or lacks consent.
 */
export function track(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  const { analytics, marketing } = useConsentStore.getState();

  if (analytics) {
    window.gtag?.("event", GA4_EVENT_NAME[event.name], gaParams(event));
    window.clarity?.("event", event.name);
  }

  if (marketing) {
    const metaName = META_STANDARD_EVENT[event.name];
    if (metaName) window.fbq?.("track", metaName, metaParams(event));
    else window.fbq?.("trackCustom", event.name, metaParams(event));

    const tiktokName = TIKTOK_STANDARD_EVENT[event.name];
    if (tiktokName) window.ttq?.track(tiktokName, tiktokParams(event));
  }
}
