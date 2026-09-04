"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Package,
  Truck,
  MapPin,
  CreditCard,
  RotateCcw,
  Loader2,
  FileText,
  MessageCircle,
  CheckCircle2,
} from "lucide-react";
import type { Order, OrderAddress } from "@/lib/orders/types";
import type { ReturnRequest, ReturnReason } from "@/lib/account/returns-store";
import { getPaymentStatusLabel, getFulfilmentStatusLabel } from "@/lib/orders/status";
import { buyAgainFromOrder } from "@/lib/buy-again";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Label } from "@/components/ui/Label";
import { Textarea } from "@/components/ui/Textarea";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { cn, formatPrice } from "@/lib/utils";

const RETURN_REASONS: { value: ReturnReason; label: string }[] = [
  { value: "changed-mind", label: "Changed my mind" },
  { value: "damaged", label: "Item arrived damaged" },
  { value: "wrong-item", label: "Received the wrong item" },
  { value: "not-as-described", label: "Not as described" },
  { value: "other", label: "Other" },
];

function AddressCard({ title, address }: { title: string; address: OrderAddress }) {
  return (
    <div className="rounded-2xl border border-sand p-5">
      <div className="mb-2 flex items-center gap-2 text-sm font-medium text-charcoal">
        <MapPin className="h-4 w-4 text-stone" aria-hidden />
        {title}
      </div>
      <p className="text-sm text-stone">
        {address.fullName}
        <br />
        {address.line1}
        {address.line2 ? <>, {address.line2}</> : null}
        <br />
        {address.suburb}, {address.city}
        <br />
        {address.province} {address.postalCode}
        <br />
        {address.phone}
      </p>
    </div>
  );
}

export function OrderDetailView({ orderNumber }: { orderNumber: string }) {
  const router = useRouter();
  const settings = useStoreSettings();
  const { products } = useCatalog();
  const [order, setOrder] = React.useState<Order | null>(null);
  const [returnRequest, setReturnRequest] = React.useState<ReturnRequest | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [buyingAgain, setBuyingAgain] = React.useState(false);
  const [returnModalOpen, setReturnModalOpen] = React.useState(false);

  const loadOrder = React.useCallback(() => {
    fetch(`/api/account/orders/${orderNumber}`)
      .then(async (res) => {
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        const data: { order: Order; returnRequest: ReturnRequest | null } = await res.json();
        setOrder(data.order);
        setReturnRequest(data.returnRequest);
      })
      .finally(() => setLoading(false));
  }, [orderNumber]);

  React.useEffect(() => {
    loadOrder();
  }, [loadOrder]);

  const handleBuyAgain = () => {
    if (!order) return;
    setBuyingAgain(true);
    buyAgainFromOrder(order, products);
    router.push("/cart");
  };

  if (loading) {
    return <div className="h-96 animate-pulse rounded-2xl bg-sand/40" />;
  }

  if (notFound || !order) {
    return (
      <div className="rounded-2xl border border-dashed border-sand p-10 text-center">
        <p className="text-sm text-stone">We couldn&apos;t find that order.</p>
        <Link href="/account/orders" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
          Back to orders
        </Link>
      </div>
    );
  }

  const payment = getPaymentStatusLabel(order.status);
  const fulfilment = getFulfilmentStatusLabel(order.status);
  const canReturn = (order.status === "paid" || order.status === "fulfilled") && !returnRequest;
  const supportMailto = `mailto:${settings.contactEmail}?subject=${encodeURIComponent(`Order ${order.orderNumber}`)}`;

  return (
    <div className="flex flex-col gap-6">
      <Breadcrumbs
        items={[
          { label: "Account", href: "/account" },
          { label: "Orders", href: "/account/orders" },
          { label: order.orderNumber },
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-charcoal">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-stone">
            Placed{" "}
            {new Date(order.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={payment.tone}>{payment.label}</Badge>
          <Badge variant={fulfilment.tone}>{fulfilment.label}</Badge>
        </div>
      </div>

      <div className="rounded-2xl border border-sand p-5 sm:p-6">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-charcoal">
          <Package className="h-4 w-4 text-stone" aria-hidden />
          Items
        </div>
        <ul className="divide-y divide-sand">
          {order.lines.map((line) => (
            <li key={`${line.productId}-${line.variantLabel ?? ""}`} className="flex items-center gap-4 py-4">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-xl bg-sand/40">
                <Image src={line.image} alt={line.name} fill sizes="56px" className="object-cover" />
              </div>
              <div className="flex-1">
                <Link
                  href={`/products/${line.slug}`}
                  className="focus-ring text-sm font-medium text-charcoal underline-offset-2 hover:underline"
                >
                  {line.name}
                </Link>
                {line.variantLabel && <p className="text-xs text-stone">{line.variantLabel}</p>}
                <p className="text-xs text-stone">
                  Qty {line.quantity} × {formatPrice(line.unitPrice)}
                </p>
              </div>
              <p className="text-sm font-medium text-charcoal">{formatPrice(line.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex flex-col gap-2 border-t border-sand pt-4 text-sm">
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
          <div className="flex justify-between text-xs text-stone">
            <span>Includes VAT</span>
            <span>{formatPrice(order.taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t border-sand pt-2 text-base font-medium">
            <span className="text-charcoal">Total</span>
            <span className="text-charcoal">{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <AddressCard title="Delivery address" address={order.deliveryAddress} />
        <AddressCard title="Billing address" address={order.billingAddress} />
      </div>

      <div className="rounded-2xl border border-sand p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-charcoal">
          <Truck className="h-4 w-4 text-stone" aria-hidden />
          Tracking
        </div>
        {order.trackingNumber ? (
          <p className="text-sm text-stone">
            {order.trackingCarrier ?? "Courier"} — {order.trackingNumber}
            {order.trackingUrl && (
              <>
                {" "}
                ·{" "}
                <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                  Track parcel
                </a>
              </>
            )}
          </p>
        ) : order.status === "fulfilled" ? (
          <p className="text-sm text-stone">Your order has shipped — tracking details will be emailed separately.</p>
        ) : order.status === "paid" ? (
          <p className="text-sm text-stone">Tracking information will appear here once your order ships.</p>
        ) : (
          <p className="text-sm text-stone">Tracking becomes available once your order is paid and fulfilled.</p>
        )}
      </div>

      <div className="rounded-2xl border border-sand p-5">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-charcoal">
          <CreditCard className="h-4 w-4 text-stone" aria-hidden />
          Payment
        </div>
        <p className="text-sm text-stone">
          {order.paymentMethod.toUpperCase()} · Reference {order.paymentReference ?? "—"}
        </p>
      </div>

      {returnRequest && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-porcelain px-5 py-4 text-sm text-stone">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-charcoal" aria-hidden />
          Return requested — we&apos;ll email you with next steps.
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/account/orders/${order.orderNumber}/invoice`} className={cn(buttonVariants({ variant: "secondary", size: "md" }))}>
          <FileText className="h-4 w-4" />
          View invoice
        </Link>
        <Button type="button" variant="secondary" disabled={buyingAgain} onClick={handleBuyAgain}>
          {buyingAgain ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Buy again
        </Button>
        {canReturn && (
          <Button type="button" variant="ghost" onClick={() => setReturnModalOpen(true)}>
            Request return
          </Button>
        )}
        <a href={supportMailto} className={cn(buttonVariants({ variant: "ghost", size: "md" }))}>
          <MessageCircle className="h-4 w-4" />
          Contact support
        </a>
      </div>

      <ReturnRequestModal
        open={returnModalOpen}
        orderNumber={order.orderNumber}
        onClose={() => setReturnModalOpen(false)}
        onSuccess={() => {
          setReturnModalOpen(false);
          loadOrder();
        }}
      />
    </div>
  );
}

function ReturnRequestModal({
  open,
  orderNumber,
  onClose,
  onSuccess,
}: {
  open: boolean;
  orderNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = React.useState<ReturnReason>("changed-mind");
  const [notes, setNotes] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/orders/${orderNumber}/return-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, notes }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      onSuccess();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Request a return">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && <p className="rounded-2xl bg-error/10 px-4 py-3 text-sm text-error">{error}</p>}

        <div>
          <Label htmlFor="return-reason">Reason</Label>
          <select
            id="return-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReturnReason)}
            className="focus-ring h-11 w-full rounded-full border border-sand bg-white px-5 text-sm text-charcoal transition-colors focus-visible:border-charcoal"
          >
            {RETURN_REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="return-notes">Notes (optional)</Label>
          <Textarea id="return-notes" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <Button type="submit" size="lg" disabled={submitting} className="mt-1">
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Submit request
        </Button>
      </form>
    </Modal>
  );
}
