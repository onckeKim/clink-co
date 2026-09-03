"use client";

import * as React from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import type { Order } from "@/lib/orders/types";
import { InvoiceDocument } from "@/components/orders/InvoiceDocument";
import { Button, buttonVariants } from "@/components/ui/Button";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { cn } from "@/lib/utils";

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

      <InvoiceDocument order={order} contactEmail={getStoreSettings().contactEmail} />
    </div>
  );
}
