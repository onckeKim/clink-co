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
