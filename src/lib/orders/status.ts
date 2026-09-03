import type { OrderStatus } from "@/lib/orders/types";

/**
 * `OrderStatus` conflates payment and fulfilment into one enum (there's no
 * separate admin fulfilment workflow in this build), so the account UI
 * derives two separate, honest labels from it rather than showing the raw
 * status twice.
 */

export type BadgeTone = "neutral" | "success" | "warning" | "error";

export function getPaymentStatusLabel(status: OrderStatus): { label: string; tone: BadgeTone } {
  switch (status) {
    case "pending_payment":
      return { label: "Payment pending", tone: "warning" };
    case "paid":
    case "fulfilled":
      return { label: "Paid", tone: "success" };
    case "payment_failed":
      return { label: "Payment failed", tone: "error" };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" };
  }
}

export function getFulfilmentStatusLabel(status: OrderStatus): { label: string; tone: BadgeTone } {
  switch (status) {
    case "fulfilled":
      return { label: "Fulfilled", tone: "success" };
    case "paid":
      return { label: "Preparing your order", tone: "warning" };
    case "cancelled":
      return { label: "Cancelled", tone: "neutral" };
    case "pending_payment":
    case "payment_failed":
      return { label: "Not yet fulfilled", tone: "neutral" };
  }
}

/**
 * Fixed hex values for the admin dashboard's order-status distribution
 * chart — status color is reserved/semantic (never a themed categorical
 * hue), per the dataviz skill. "Paid" and "Fulfilled" both read as
 * positive outcomes but get two distinguishable steps of green rather than
 * one shared color, so a distribution chart can still tell them apart.
 */
export function getOrderStatusChartColor(status: OrderStatus): string {
  switch (status) {
    case "paid":
      return "#0ca30c"; // good
    case "fulfilled":
      return "#287a4b"; // good, deeper step — this app's own --color-success
    case "pending_payment":
      return "#fab219"; // warning
    case "payment_failed":
      return "#d03b3b"; // critical
    case "cancelled":
      return "#746c62"; // neutral — this app's own --color-stone
  }
}

export function getOrderStatusLabel(status: OrderStatus): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "fulfilled":
      return "Fulfilled";
    case "pending_payment":
      return "Pending payment";
    case "payment_failed":
      return "Payment failed";
    case "cancelled":
      return "Cancelled";
  }
}
