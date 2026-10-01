"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Ban, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

interface OrderStatusResponse {
  orderNumber: string;
  status: string;
  paymentMethod: string;
  paymentReference?: string;
  total: number;
}

type SimulatedOutcome = "paid" | "failed" | "cancelled";

/**
 * Stands in for a real gateway's hosted payment page — only reachable via
 * the "test" provider (see src/lib/payments/providers/test.ts), which is
 * itself gated out of production. Picking an outcome here triggers a real
 * server-to-server webhook call (via /api/payments/test/simulate), exactly
 * exercising the same code path a live PayFast/Ozow/Yoco/Peach payment
 * would.
 */
export function PaymentSimulatorView({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref") ?? "";

  const [order, setOrder] = React.useState<OrderStatusResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [simulating, setSimulating] = React.useState<SimulatedOutcome | null>(null);

  React.useEffect(() => {
    fetch(`/api/payments/${orderNumber}/status`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [orderNumber]);

  const simulate = async (outcome: SimulatedOutcome) => {
    setSimulating(outcome);
    try {
      await fetch("/api/payments/test/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderNumber, reference, status: outcome }),
      });
    } finally {
      router.push(outcome === "paid" ? `/checkout/confirmation/${orderNumber}` : `/checkout/confirmation/${orderNumber}?payment=${outcome}`);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-md px-6 py-24 text-center text-sm text-stone">Loading order…</div>;
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <p className="font-display text-xl text-charcoal">Order not found</p>
        <p className="mt-2 text-sm text-stone">This payment link may have expired.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Test Payment Simulator</p>
        <p className="mt-2 text-sm text-stone">
          Stands in for a real gateway&apos;s hosted payment page — pick an outcome to continue.
        </p>
      </div>

      <div className="w-full rounded-3xl border border-sand p-6">
        <p className="text-sm text-stone">Order {order.orderNumber}</p>
        <p className="font-display mt-1 text-3xl text-charcoal">{formatPrice(order.total)}</p>
        <p className="mt-1 text-xs text-stone">Reference: {reference}</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        <Button type="button" size="lg" disabled={Boolean(simulating)} onClick={() => simulate("paid")}>
          {simulating === "paid" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
          Simulate successful payment
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          disabled={Boolean(simulating)}
          onClick={() => simulate("failed")}
        >
          {simulating === "failed" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          Simulate failed payment
        </Button>
        <Button type="button" variant="ghost" size="lg" disabled={Boolean(simulating)} onClick={() => simulate("cancelled")}>
          {simulating === "cancelled" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
          Cancel payment
        </Button>
      </div>
    </div>
  );
}
