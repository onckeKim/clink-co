import { describe, it, expect, afterEach } from "vitest";
import { computeCartTotals } from "@/lib/cart";
import { updateStoreSettings, getStoreSettings } from "@/lib/admin/settings-store";

const originalSettings = getStoreSettings();

afterEach(() => {
  updateStoreSettings(originalSettings);
});

describe("computeCartTotals (price calculations)", () => {
  it("adds delivery fee on top of the subtotal when there's no discount", () => {
    const totals = computeCartTotals({ subtotal: 1000, discountAmount: 0, deliveryFee: 95 });
    expect(totals.total).toBe(1095);
    expect(totals.subtotal).toBe(1000);
    expect(totals.deliveryFee).toBe(95);
  });

  it("subtracts the discount from the subtotal before adding delivery", () => {
    const totals = computeCartTotals({ subtotal: 1000, discountAmount: 200, deliveryFee: 95 });
    expect(totals.total).toBe(895);
  });

  it("clamps the discounted subtotal at zero — a discount can never make the total negative", () => {
    const totals = computeCartTotals({ subtotal: 100, discountAmount: 500, deliveryFee: 0 });
    expect(totals.total).toBe(0);
    expect(totals.taxAmount).toBe(0);
  });

  it("computes VAT as already included in the total, not added on top (15% default rate)", () => {
    // total = 1150 at 15% VAT-inclusive => tax = 1150 * 15/115 = 150
    const totals = computeCartTotals({ subtotal: 1150, discountAmount: 0, deliveryFee: 0 });
    expect(totals.taxAmount).toBe(150);
    expect(totals.total).toBe(1150);
  });

  it("rounds the tax breakdown to the nearest Rand", () => {
    const totals = computeCartTotals({ subtotal: 999, discountAmount: 0, deliveryFee: 0 });
    // 999 * 15/115 = 130.30... -> rounds to 130
    expect(totals.taxAmount).toBe(130);
  });

  it("recomputes tax against a changed store VAT rate", () => {
    updateStoreSettings({ taxRatePercent: 20 });
    const totals = computeCartTotals({ subtotal: 1200, discountAmount: 0, deliveryFee: 0 });
    // 1200 * 20/120 = 200
    expect(totals.taxAmount).toBe(200);
  });

  it("handles a fully free order (zero subtotal, zero delivery)", () => {
    const totals = computeCartTotals({ subtotal: 0, discountAmount: 0, deliveryFee: 0 });
    expect(totals).toEqual({ subtotal: 0, discountAmount: 0, deliveryFee: 0, taxAmount: 0, total: 0 });
  });

  it("free delivery (fee 0) still keeps the discounted subtotal as the total", () => {
    const totals = computeCartTotals({ subtotal: 500, discountAmount: 100, deliveryFee: 0 });
    expect(totals.total).toBe(400);
  });
});
