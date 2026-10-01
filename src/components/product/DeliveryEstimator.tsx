"use client";

import * as React from "react";
import { Info, Truck } from "lucide-react";
import { estimateDelivery, type DeliveryEstimate } from "@/lib/delivery";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatPrice } from "@/lib/utils";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";

/** South African delivery estimator — postal code in, an illustrative range/fee/free-delivery read-out out. See src/lib/delivery.ts. */
export function DeliveryEstimator({ orderValue }: { orderValue: number }) {
  const settings = useStoreSettings();
  const [postalCode, setPostalCode] = React.useState("");
  const [estimate, setEstimate] = React.useState<DeliveryEstimate | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = estimateDelivery(postalCode, orderValue, settings.freeDeliveryThreshold);
    if (result.ok) {
      setEstimate(result.estimate);
      setError(null);
    } else {
      setEstimate(null);
      setError(result.error);
    }
  };

  return (
    <div className="rounded-2xl border border-sand p-5">
      <p className="flex items-center gap-2 text-sm font-medium text-charcoal">
        <Truck className="h-4 w-4" />
        Estimate delivery
      </p>

      <form onSubmit={handleSubmit} className="mt-3 flex items-center gap-2">
        <label htmlFor="delivery-postal-code" className="sr-only">
          South African postal code
        </label>
        <Input
          id="delivery-postal-code"
          inputMode="numeric"
          placeholder="Postal code, e.g. 8001"
          value={postalCode}
          onChange={(e) => setPostalCode(e.target.value.replace(/[^\d]/g, "").slice(0, 4))}
          error={error ?? undefined}
          aria-describedby="delivery-postal-code-error delivery-disclaimer"
          className="h-11 flex-1"
        />
        <Button type="submit" variant="secondary" className="shrink-0">
          Check
        </Button>
      </form>

      {error && (
        <p id="delivery-postal-code-error" className="mt-2 text-xs text-error">
          {error}
        </p>
      )}

      {estimate && (
        <div className="mt-4 flex flex-col gap-1.5 rounded-xl bg-porcelain p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-stone">Delivery to {estimate.postalCode}</span>
            <span className="font-medium text-charcoal">
              {estimate.minDays}–{estimate.maxDays} business days
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-stone">{estimate.zoneLabel} delivery fee</span>
            <span className="font-medium text-charcoal">
              {estimate.freeDeliveryEligible ? "Free" : formatPrice(estimate.fee)}
            </span>
          </div>
          {!estimate.freeDeliveryEligible && (
            <p className="mt-1 text-xs text-stone">
              Add {formatPrice(estimate.freeDeliveryThreshold - orderValue)} more to qualify for free delivery.
            </p>
          )}
          {estimate.freeDeliveryEligible && (
            <p className="mt-1 text-xs text-success">This order qualifies for free delivery.</p>
          )}
        </div>
      )}

      <p id="delivery-disclaimer" className="mt-3 flex items-start gap-1.5 text-xs text-stone">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        This is an estimate. Final delivery cost and timing are confirmed at checkout based on your full
        address and order.
      </p>
    </div>
  );
}
