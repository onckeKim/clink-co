"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Truck, XCircle } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import type { Order } from "@/lib/orders/types";
import { buttonVariants } from "@/components/ui/Button";
import { CreateAccountPrompt } from "@/components/checkout/CreateAccountPrompt";
import { cn, formatPrice } from "@/lib/utils";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });
}

export function ConfirmationView({ orderNumber }: { orderNumber: string }) {
  const searchParams = useSearchParams();
  const paymentIssue = searchParams.get("payment");
  const [order, setOrder] = React.useState<Order | null>(null);
  const [loading, setLoading] = React.useState(true);
  const clearCart = useCartStore((state) => state.clear);
  const clearedRef = React.useRef(false);

  React.useEffect(() => {
    fetch(`/api/orders/${orderNumber}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { order?: Order } | null) => setOrder(data?.order ?? null))
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const paymentDidNotSucceed =
    paymentIssue === "failed" ||
    paymentIssue === "cancelled" ||
    order?.status === "payment_failed" ||
    order?.status === "cancelled";

  React.useEffect(() => {
    // The cart's contents are only committed once payment actually
    // succeeds. Clearing it on a failed/cancelled attempt too would strand
    // the "Try again" link below — /checkout redirects straight back to
    // /cart when the cart is empty — so the bag is left untouched until
    // there's a real order to show for it.
    if (!clearedRef.current && order && !paymentDidNotSucceed) {
      clearCart();
      clearedRef.current = true;
    }
  }, [order, paymentDidNotSucceed, clearCart]);

  if (loading) {
    return <div className="mx-auto max-w-2xl px-6 py-24 text-center text-sm text-stone">Loading your order…</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <p className="font-display text-xl text-charcoal">We couldn&apos;t find that order</p>
        <Link href="/shop" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
          Back to shop
        </Link>
      </div>
    );
  }

  const paymentCancelled = paymentIssue === "cancelled" || order.status === "cancelled";

  if (paymentDidNotSucceed) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-24 text-center">
        <XCircle className="mx-auto h-10 w-10 text-error" aria-hidden />
        <p className="font-display mt-4 text-2xl text-charcoal">
          {paymentCancelled ? "Payment cancelled" : "Payment failed"}
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone">
          Your order <strong>{order.orderNumber}</strong> hasn&apos;t been paid for yet — nothing has been
          charged. You can try again or choose a different payment method.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/checkout" className={cn(buttonVariants({ size: "lg" }))}>
            Try again
          </Link>
          <Link href="/cart" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
            Back to bag
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-16 sm:px-8">
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" aria-hidden />
        <p className="font-display mt-4 text-3xl text-charcoal">
          Thank you, {order.customerName.split(" ")[0] || order.customerName}
        </p>
        <p className="mt-2 text-sm text-stone">Your order is confirmed.</p>
      </div>

      <div className="mt-10 rounded-3xl border border-sand p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sand pb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-stone">Order number</p>
            <p className="text-lg font-medium text-charcoal">{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-stone">Payment reference</p>
            <p className="text-sm text-charcoal">{order.paymentReference ?? "—"}</p>
          </div>
        </div>

        <ul className="divide-y divide-sand py-4">
          {order.lines.map((line) => (
            <li
              key={`${line.productId}-${line.variantLabel ?? ""}`}
              className="flex items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm text-charcoal">
                  {line.name}
                  {line.variantLabel ? ` — ${line.variantLabel}` : ""}
                </p>
                <p className="text-xs text-stone">Qty {line.quantity}</p>
              </div>
              <p className="text-sm font-medium text-charcoal">{formatPrice(line.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 border-t border-sand pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-stone">Subtotal</span>
            <span className="text-charcoal">{formatPrice(order.subtotal)}</span>
          </div>
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-success">
              <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
              <span>-{formatPrice(order.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-stone">Delivery ({order.deliveryLabel})</span>
            <span className="text-charcoal">{order.deliveryFee === 0 ? "Free" : formatPrice(order.deliveryFee)}</span>
          </div>
          <div className="flex justify-between border-t border-sand pt-2 text-base font-medium">
            <span className="text-charcoal">Total</span>
            <span className="text-charcoal">{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-porcelain p-4 text-sm text-stone">
          <Truck className="h-4 w-4 shrink-0" aria-hidden />
          Estimated delivery: {formatDate(order.estimatedDeliveryEarliest)} – {formatDate(order.estimatedDeliveryLatest)}
        </div>

        {order.paymentMethod === "eft" && (
          <div className="mt-4 rounded-2xl border border-sand p-4 text-sm text-stone">
            <p className="font-medium text-charcoal">Bank transfer details</p>
            <p className="mt-2">
              Use reference <strong>{order.orderNumber}</strong> — your order ships once payment clears.
            </p>
          </div>
        )}

        <p className="mt-6 text-xs text-stone">A confirmation email has been sent to {order.customerEmail}.</p>

        {order.isGuest && <CreateAccountPrompt email={order.customerEmail} customerName={order.customerName} />}
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/shop" className={cn(buttonVariants({ size: "lg" }))}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
