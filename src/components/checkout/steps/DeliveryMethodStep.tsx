"use client";

import { getAvailableDeliveryMethods, quoteDelivery } from "@/lib/delivery";
import type { AddressInput } from "@/lib/validations/checkout";
import type { DeliveryMethodId } from "@/config/delivery";
import { Button } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";

export function DeliveryMethodStep({
  deliveryAddress,
  orderValue,
  freeDeliveryOverride,
  selectedMethodId,
  onSelect,
  onBack,
  onNext,
}: {
  deliveryAddress: AddressInput;
  orderValue: number;
  freeDeliveryOverride: boolean;
  selectedMethodId?: DeliveryMethodId;
  onSelect: (id: DeliveryMethodId) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const settings = useStoreSettings();
  const availableMethods = getAvailableDeliveryMethods(
    deliveryAddress.province,
    deliveryAddress.postalCode,
    settings.enabledDeliveryMethodIds,
  );

  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-charcoal">Delivery Method</h2>
      <div className="flex flex-col gap-3">
        {availableMethods.map((method) => {
          const quote = quoteDelivery({
            methodId: method.id,
            province: deliveryAddress.province,
            postalCode: deliveryAddress.postalCode,
            orderValue,
            freeDeliveryOverride,
            freeDeliveryThreshold: settings.freeDeliveryThreshold,
            enabledDeliveryMethodIds: settings.enabledDeliveryMethodIds,
          });
          const selected = selectedMethodId === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              aria-pressed={selected}
              className={cn(
                "focus-ring flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors",
                selected ? "border-charcoal bg-porcelain" : "border-sand hover:border-charcoal/40",
              )}
            >
              <div>
                <p className="text-sm font-medium text-charcoal">{method.label}</p>
                <p className="text-xs text-stone">{method.description}</p>
                {quote.ok && (
                  <p className="mt-1 text-xs text-stone">
                    {quote.quote.minDays}–{quote.quote.maxDays} business days
                  </p>
                )}
              </div>
              <p className="shrink-0 text-sm font-medium text-charcoal">
                {quote.ok ? (quote.quote.fee === 0 ? "Free" : formatPrice(quote.quote.fee)) : "—"}
              </p>
            </button>
          );
        })}
        {availableMethods.length === 0 && (
          <p className="text-sm text-stone">No delivery methods are available for this address.</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="button" size="lg" disabled={!selectedMethodId} onClick={onNext}>
          Continue to billing address
        </Button>
      </div>
    </div>
  );
}
