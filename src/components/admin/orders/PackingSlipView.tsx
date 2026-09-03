"use client";

import { Printer } from "lucide-react";
import type { Order } from "@/lib/orders/types";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/layout/Logo";

/** Prices are deliberately omitted — a packing slip travels with the physical shipment, not the customer's payment details. */
export function PackingSlipView({ order, businessName }: { order: Order; businessName: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-end print:hidden">
        <Button type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print packing slip
        </Button>
      </div>

      <div className="rounded-3xl border border-sand bg-warm-white p-8 print:rounded-none print:border-none print:p-0 sm:p-10">
        <div className="flex items-start justify-between border-b border-sand pb-6">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-stone">{businessName}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg text-charcoal">Packing Slip</p>
            <p className="mt-1 text-xs text-stone">{order.orderNumber}</p>
            <p className="text-xs text-stone">{new Date(order.createdAt).toLocaleDateString("en-ZA")}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone">Ship to</p>
            <p className="mt-2 text-sm text-charcoal">{order.deliveryAddress.fullName}</p>
            <p className="text-sm text-stone">{order.deliveryAddress.line1}</p>
            {order.deliveryAddress.line2 && <p className="text-sm text-stone">{order.deliveryAddress.line2}</p>}
            <p className="text-sm text-stone">
              {order.deliveryAddress.suburb}, {order.deliveryAddress.city}
            </p>
            <p className="text-sm text-stone">
              {order.deliveryAddress.province} {order.deliveryAddress.postalCode}
            </p>
            <p className="text-sm text-stone">{order.deliveryAddress.phone}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-stone">Delivery</p>
            <p className="mt-2 text-sm text-charcoal">{order.deliveryLabel}</p>
            {order.shippingNotes && <p className="mt-2 text-sm text-stone">Note: {order.shippingNotes}</p>}
            {order.giftMessage && <p className="mt-2 text-sm text-stone">Gift message: &ldquo;{order.giftMessage}&rdquo;</p>}
          </div>
        </div>

        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-xs uppercase tracking-[0.1em] text-stone">
              <th className="pb-2 font-medium">SKU</th>
              <th className="pb-2 font-medium">Item</th>
              <th className="pb-2 text-right font-medium">Qty</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={`${line.productId}-${line.variantLabel ?? ""}`} className="border-b border-sand/60">
                <td className="py-2 text-stone">{line.sku}</td>
                <td className="py-2 text-charcoal">
                  {line.name}
                  {line.variantLabel ? ` — ${line.variantLabel}` : ""}
                </td>
                <td className="py-2 text-right text-charcoal">{line.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
