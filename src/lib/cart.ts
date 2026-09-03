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
 * independent of the cart store — and independent of where taxRatePercent
 * comes from — so it's trivially testable and reusable from both the
 * client (live totals, sourced from useStoreSettings()) and the server
 * (checkout order creation re-derives the same numbers rather than
 * trusting the client's, sourced from await getStoreSettings()).
 */
export function computeCartTotals({
  subtotal,
  discountAmount,
  deliveryFee,
  taxRatePercent,
}: {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxRatePercent: number;
}): CartTotals {
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const total = discountedSubtotal + deliveryFee;
  const taxAmount = Math.round((total * taxRatePercent) / (100 + taxRatePercent));

  return { subtotal, discountAmount, deliveryFee, taxAmount, total };
}
