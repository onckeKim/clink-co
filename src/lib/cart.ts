import { siteConfig } from "@/config/site";

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  /** VAT already embedded in `total` (South African prices are VAT-inclusive) — shown as an informational breakdown, not added on top. */
  taxAmount: number;
  total: number;
}

/**
 * Pure cart math: subtotal minus any coupon discount, plus the chosen
 * delivery fee, with the VAT portion broken out for display. Kept
 * independent of the cart store so it's trivially testable and reusable
 * from both the client (live totals) and the server (checkout order
 * creation re-derives the same numbers rather than trusting the client's).
 */
export function computeCartTotals({
  subtotal,
  discountAmount,
  deliveryFee,
}: {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
}): CartTotals {
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const total = discountedSubtotal + deliveryFee;
  const taxAmount = Math.round((total * siteConfig.taxRatePercent) / (100 + siteConfig.taxRatePercent));

  return { subtotal, discountAmount, deliveryFee, taxAmount, total };
}
