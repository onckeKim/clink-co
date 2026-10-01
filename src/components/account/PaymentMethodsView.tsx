"use client";

import * as React from "react";
import Link from "next/link";
import { CreditCard, ShieldCheck } from "lucide-react";
import type { Order } from "@/lib/orders/types";

const METHOD_LABELS: Record<Order["paymentMethod"], string> = {
  test: "Test Payment",
  payfast: "PayFast",
  peach: "Peach Payments",
  yoco: "Yoco",
  ozow: "Ozow",
  eft: "EFT / Bank Transfer",
};

export function PaymentMethodsView() {
  const [orders, setOrders] = React.useState<Order[] | null>(null);

  React.useEffect(() => {
    fetch("/api/account/orders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { orders?: Order[] } | null) => setOrders(data?.orders ?? []));
  }, []);

  const paidOrders = orders?.filter((o) => o.paymentReference) ?? [];

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Payment Methods</h1>
        <p className="mt-1.5 text-sm text-stone">Payment references from your past orders.</p>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl bg-porcelain px-5 py-4 text-xs text-stone">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        For your security, we never store card numbers, CVVs or bank account details — that data lives only with our
        payment providers (PayFast, Peach, Yoco, Ozow) under PCI-DSS. What&apos;s shown here is just the transaction
        reference from each order.
      </div>

      {orders === null ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-sand/40" />
          ))}
        </div>
      ) : paidOrders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand p-10 text-center">
          <CreditCard className="mx-auto h-8 w-8 text-stone" aria-hidden />
          <p className="mt-3 text-sm text-stone">No payment references yet — they&apos;ll appear here after your first order.</p>
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-sand rounded-2xl border border-sand">
          {paidOrders.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-sm font-medium text-charcoal">{METHOD_LABELS[order.paymentMethod]}</p>
                <p className="mt-0.5 text-xs text-stone">Reference {order.paymentReference}</p>
              </div>
              <Link
                href={`/account/orders/${order.orderNumber}`}
                className="focus-ring text-xs text-stone underline-offset-2 hover:text-charcoal hover:underline"
              >
                {order.orderNumber}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
