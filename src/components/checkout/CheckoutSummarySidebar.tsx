import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import type { CartLine } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

export function CheckoutSummarySidebar({
  lines,
  subtotal,
  discountAmount,
  couponCode,
  deliveryFee,
  deliveryFeeKnown,
  taxAmount,
  total,
  taxRatePercent,
}: {
  lines: CartLine[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  deliveryFee: number;
  deliveryFeeKnown: boolean;
  taxAmount: number;
  total: number;
  taxRatePercent: number;
}) {
  return (
    <div className="flex h-fit flex-col gap-5 rounded-3xl border border-sand p-6 lg:sticky lg:top-28">
      <ul className="flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.lineId} className="flex items-center gap-3">
            <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-sand/50">
              <Image src={line.image} alt={line.name} fill sizes="40px" className="object-cover" />
              <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-charcoal text-[10px] text-warm-white">
                {line.quantity}
              </span>
            </div>
            <p className="min-w-0 flex-1 truncate text-xs text-stone">{line.name}</p>
            <p className="shrink-0 text-xs font-medium text-charcoal">{formatPrice(line.price * line.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2 border-t border-sand pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-stone">Subtotal</span>
          <span className="text-charcoal">{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-success">
            <span>Discount{couponCode ? ` (${couponCode})` : ""}</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-stone">Delivery</span>
          <span className="text-charcoal">
            {deliveryFeeKnown ? (deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)) : "Calculated next step"}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-stone">
          <span>Includes VAT ({taxRatePercent}%)</span>
          <span>{formatPrice(taxAmount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-sand pt-2 text-base font-medium">
          <span className="text-charcoal">Total</span>
          <span className="text-charcoal">{formatPrice(total)}</span>
        </div>
      </div>

      <p className="flex items-center gap-1.5 text-xs text-stone">
        <ShieldCheck className="h-3.5 w-3.5 shrink-0" />
        Secure checkout — encrypted in transit.
      </p>
    </div>
  );
}
