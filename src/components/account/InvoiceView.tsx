"use client";

import * as React from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import type { Order } from "@/lib/orders/types";
import { Logo } from "@/components/layout/Logo";
import { Button, buttonVariants } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { cn, formatPrice } from "@/lib/utils";

export function InvoiceView({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    fetch(`/api/account/orders/${orderNumber}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data: { order: Order } = await res.json();
        setOrder(data.order);
      })
      .finally(() => setLoading(false));
  }, [orderNumber]);

  if (loading) {
    return <div className="mx-auto h-96 max-w-3xl animate-pulse rounded-2xl bg-sand/40" />;
  }

  if (notFound || !order) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-sand p-10 text-center">
        <p className="text-sm text-stone">We couldn&apos;t find that order.</p>
        <Link href="/account/orders" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
          Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/account/orders/${order.orderNumber}`} className="text-sm text-stone underline-offset-2 hover:text-charcoal hover:underline">
          Back to order
        </Link>
        <Button type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <div className="rounded-3xl border border-sand bg-warm-white p-8 print:rounded-none print:border-none print:p-0 sm:p-10">
        <div className="flex items-start justify-between border-b border-sand pb-6">
          <div>
            <Logo />
            <p className="mt-3 text-xs text-stone">
              {siteConfig.contactEmail}
              <br />
              {siteConfig.url.replace(/^https?:\/\//, "")}
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-lg text-charcoal">Tax Invoice</p>
            <p className="mt-1 text-xs text-stone">{order.orderNumber}</p>
            <p className="text-xs text-stone">
              {new Date(order.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="grid gap-6 border-b border-sand py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone">Billed to</p>
            <p className="mt-2 text-sm text-charcoal">
              {order.billingAddress.fullName}
              <br />
              {order.billingAddress.line1}
              {order.billingAddress.line2 ? <>, {order.billingAddress.line2}</> : null}
              <br />
              {order.billingAddress.suburb}, {order.billingAddress.city}
              <br />
              {order.billingAddress.province} {order.billingAddress.postalCode}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-stone">Delivered to</p>
            <p className="mt-2 text-sm text-charcoal">
              {order.deliveryAddress.fullName}
              <br />
              {order.deliveryAddress.line1}
              {order.deliveryAddress.line2 ? <>, {order.deliveryAddress.line2}</> : null}
              <br />
              {order.deliveryAddress.suburb}, {order.deliveryAddress.city}
              <br />
              {order.deliveryAddress.province} {order.deliveryAddress.postalCode}
            </p>
          </div>
        </div>

        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-sand text-left text-xs uppercase tracking-wide text-stone">
              <th className="py-3 font-medium">Item</th>
              <th className="py-3 text-right font-medium">Qty</th>
              <th className="py-3 text-right font-medium">Unit price</th>
              <th className="py-3 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.lines.map((line) => (
              <tr key={`${line.productId}-${line.variantLabel ?? ""}`} className="border-b border-sand/60">
                <td className="py-3 text-charcoal">
                  {line.name}
                  {line.variantLabel ? ` — ${line.variantLabel}` : ""}
                  <br />
                  <span className="text-xs text-stone">SKU {line.sku}</span>
                </td>
                <td className="py-3 text-right text-charcoal">{line.quantity}</td>
                <td className="py-3 text-right text-charcoal">{formatPrice(line.unitPrice)}</td>
                <td className="py-3 text-right text-charcoal">{formatPrice(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto mt-4 flex w-full max-w-xs flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-stone">Subtotal</span>
            <span className="text-charcoal">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between">
              <span className="text-stone">Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span className="text-charcoal">-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone">Delivery</span>
            <span className="text-charcoal">{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between text-xs text-stone">
            <span>Includes VAT</span>
            <span>{formatPrice(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-sand pt-2 text-base font-medium">
            <span className="text-charcoal">Total</span>
            <span className="text-charcoal">{formatPrice(order.total)}</span>
          </div>
        </div>

        <p className="mt-8 border-t border-sand pt-4 text-xs text-stone">
          Payment method: {order.paymentMethod.toUpperCase()} · Reference: {order.paymentReference ?? "—"}
        </p>
      </div>
    </div>
  );
}
