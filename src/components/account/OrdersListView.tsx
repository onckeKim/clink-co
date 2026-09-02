"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, RotateCcw, Loader2 } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { getPaymentStatusLabel, getFulfilmentStatusLabel } from "@/lib/orders/status";
import { buyAgainFromOrder } from "@/lib/buy-again";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";

type FilterTab = "all" | "processing" | "fulfilled" | "cancelled";

const TABS: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All orders" },
  { id: "processing", label: "Processing" },
  { id: "fulfilled", label: "Fulfilled" },
  { id: "cancelled", label: "Cancelled" },
];

function matchesTab(status: OrderStatus, tab: FilterTab): boolean {
  if (tab === "all") return true;
  if (tab === "processing") return status === "pending_payment" || status === "paid";
  if (tab === "fulfilled") return status === "fulfilled";
  return status === "cancelled" || status === "payment_failed";
}

export function OrdersListView() {
  const router = useRouter();
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [tab, setTab] = React.useState<FilterTab>("all");
  const [buyingAgain, setBuyingAgain] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/account/orders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { orders?: Order[] } | null) => setOrders(data?.orders ?? []));
  }, []);

  const filtered = orders?.filter((order) => matchesTab(order.status, tab)) ?? [];

  const handleBuyAgain = (order: Order) => {
    setBuyingAgain(order.id);
    buyAgainFromOrder(order);
    router.push("/cart");
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Order History</h1>
        <p className="mt-1.5 text-sm text-stone">Every order you&apos;ve placed, in one place.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              "focus-ring rounded-full border px-4 py-2 text-sm transition-colors",
              tab === t.id ? "border-charcoal bg-charcoal text-warm-white" : "border-sand text-charcoal hover:border-charcoal/40",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {orders === null ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-sand/40" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-sand p-10 text-center">
          <Package className="mx-auto h-8 w-8 text-stone" aria-hidden />
          <p className="mt-3 text-sm text-stone">
            {orders.length === 0 ? "You haven't placed any orders yet." : "No orders match this filter."}
          </p>
          {orders.length === 0 && (
            <Link href="/shop" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
              Start shopping
            </Link>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((order) => {
            const payment = getPaymentStatusLabel(order.status);
            const fulfilment = getFulfilmentStatusLabel(order.status);
            return (
              <li key={order.id} className="rounded-2xl border border-sand p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/account/orders/${order.orderNumber}`}
                      className="focus-ring text-sm font-medium text-charcoal underline-offset-2 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                    <p className="mt-1 text-xs text-stone">
                      Placed{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-ZA", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-2 text-sm text-stone">
                      {order.lines.map((l) => l.name).join(", ")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex gap-2">
                      <Badge variant={payment.tone}>{payment.label}</Badge>
                      <Badge variant={fulfilment.tone}>{fulfilment.label}</Badge>
                    </div>
                    <p className="text-sm font-medium text-charcoal">{formatPrice(order.total)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 border-t border-sand pt-4">
                  <Link href={`/account/orders/${order.orderNumber}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                    View details
                  </Link>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={buyingAgain === order.id}
                    onClick={() => handleBuyAgain(order)}
                  >
                    {buyingAgain === order.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="h-3.5 w-3.5" />
                    )}
                    Buy again
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
