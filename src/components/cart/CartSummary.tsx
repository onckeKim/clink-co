"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useCartStore, useCartSubtotal } from "@/store/cart-store";
import { computeCartTotals } from "@/lib/cart";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

/**
 * Coupon entry + the subtotal/discount/delivery/tax/total breakdown,
 * shared by the mini-cart drawer and the full cart page. The delivery fee
 * here is necessarily an estimate — the exact quote depends on a delivery
 * address/method, which isn't known until checkout (src/lib/delivery.ts's
 * `quoteDelivery`) — so it shows "Free" once eligible and a from-price
 * otherwise, with a note that checkout confirms the final figure.
 */
export function CartSummary({ compact = false }: { compact?: boolean }) {
  const subtotal = useCartSubtotal();
  const coupon = useCartStore((state) => state.coupon);
  const couponError = useCartStore((state) => state.couponError);
  const applyCoupon = useCartStore((state) => state.applyCoupon);
  const removeCoupon = useCartStore((state) => state.removeCoupon);
  const [code, setCode] = React.useState("");

  const settings = getStoreSettings();
  const discountAmount = coupon?.discountAmount ?? 0;
  const netSubtotal = Math.max(0, subtotal - discountAmount);
  const freeDelivery = Boolean(coupon?.freeDelivery) || netSubtotal >= settings.freeDeliveryThreshold;
  const estimatedDeliveryFee = freeDelivery ? 0 : 95;
  const totals = computeCartTotals({ subtotal, discountAmount, deliveryFee: estimatedDeliveryFee });

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (code.trim()) applyCoupon(code);
        }}
        className="flex items-center gap-2"
      >
        <label htmlFor="cart-coupon-code" className="sr-only">
          Coupon code
        </label>
        <Input
          id="cart-coupon-code"
          placeholder="Coupon code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="h-10 flex-1 text-sm"
        />
        <Button type="submit" variant="secondary" size="sm" className="shrink-0">
          Apply
        </Button>
      </form>

      {couponError && <p className="text-xs text-error">{couponError}</p>}

      {coupon && (
        <div className="flex items-center justify-between rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
          <span>&ldquo;{coupon.code}&rdquo; applied</span>
          <button
            type="button"
            onClick={removeCoupon}
            aria-label="Remove coupon"
            className="focus-ring -m-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-stone">Subtotal</span>
          <span className="text-charcoal">{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-success">
            <span>Discount{coupon ? ` (${coupon.code})` : ""}</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-stone">Estimated delivery</span>
          <span className="text-charcoal">{freeDelivery ? "Free" : `From ${formatPrice(estimatedDeliveryFee)}`}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-stone">
          <span>Includes VAT ({settings.taxRatePercent}%)</span>
          <span>{formatPrice(totals.taxAmount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-sand pt-2 text-base font-medium">
          <span className="text-charcoal">Estimated total</span>
          <span className="text-charcoal">{formatPrice(totals.total)}</span>
        </div>
      </div>

      {!compact && (
        <p className="text-xs text-stone">
          Final delivery cost is confirmed at checkout, once we know your address.
        </p>
      )}
    </div>
  );
}
