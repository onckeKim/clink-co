"use client";

import * as React from "react";
import Link from "next/link";
import { FileText, Loader2, Mail, Printer } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/orders/types";
import type { OrderNote } from "@/lib/admin/order-notes-store";
import { getPaymentStatusLabel } from "@/lib/orders/status";
import { Badge } from "@/components/ui/Badge";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { cn, formatPrice } from "@/lib/utils";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending_payment", label: "Payment pending" },
  { value: "paid", label: "Paid" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "payment_failed", label: "Payment failed" },
  { value: "cancelled", label: "Cancelled" },
];

function badgeVariantFor(tone: ReturnType<typeof getPaymentStatusLabel>["tone"]) {
  if (tone === "success") return "success" as const;
  if (tone === "error") return "error" as const;
  if (tone === "warning") return "warning" as const;
  return "neutral" as const;
}

function AddressBlock({ title, address }: { title: string; address: Order["deliveryAddress"] }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-stone">{title}</p>
      <p className="mt-2 text-sm text-charcoal">
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

export function AdminOrderDetailView({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = React.useState<Order | null>(null);
  const [notes, setNotes] = React.useState<OrderNote[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [statusValue, setStatusValue] = React.useState<OrderStatus>("pending_payment");
  const [savingStatus, setSavingStatus] = React.useState(false);

  const [trackingCarrier, setTrackingCarrier] = React.useState("");
  const [trackingNumber, setTrackingNumber] = React.useState("");
  const [trackingUrl, setTrackingUrl] = React.useState("");
  const [savingTracking, setSavingTracking] = React.useState(false);

  const [refundAmount, setRefundAmount] = React.useState("");
  const [refundReason, setRefundReason] = React.useState("");
  const [savingRefund, setSavingRefund] = React.useState(false);

  const [cancelReason, setCancelReason] = React.useState("");
  const [confirmCancel, setConfirmCancel] = React.useState(false);
  const [cancelling, setCancelling] = React.useState(false);

  const [noteDraft, setNoteDraft] = React.useState("");
  const [addingNote, setAddingNote] = React.useState(false);

  const load = React.useCallback(() => {
    Promise.all([
      fetch(`/api/admin/orders/${orderNumber}`).then((res) => (res.ok ? res.json() : null)),
      fetch(`/api/admin/orders/${orderNumber}/notes`).then((res) => (res.ok ? res.json() : null)),
    ]).then(([orderData, notesData]: [{ order?: Order } | null, { notes?: OrderNote[] } | null]) => {
      if (orderData?.order) {
        setOrder(orderData.order);
        setStatusValue(orderData.order.status);
        setTrackingCarrier(orderData.order.trackingCarrier ?? "");
        setTrackingNumber(orderData.order.trackingNumber ?? "");
        setTrackingUrl(orderData.order.trackingUrl ?? "");
      }
      setNotes(notesData?.notes ?? []);
      setLoading(false);
    });
  }, [orderNumber]);

  React.useEffect(load, [load]);

  const handleStatusUpdate = async () => {
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't update status.");
        return;
      }
      setOrder(data.order);
      toast.success("Order status updated.");
    } finally {
      setSavingStatus(false);
    }
  };

  const handleTrackingSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCarrier.trim() || !trackingNumber.trim()) {
      toast.error("Enter a carrier and tracking number.");
      return;
    }
    setSavingTracking(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/tracking`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingCarrier, trackingNumber, trackingUrl: trackingUrl || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save tracking information.");
        return;
      }
      setOrder(data.order);
      toast.success("Tracking information saved.");
    } finally {
      setSavingTracking(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(refundAmount);
    if (!amount || amount <= 0) {
      toast.error("Enter a refund amount greater than 0.");
      return;
    }
    setSavingRefund(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, reason: refundReason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't record this refund.");
        return;
      }
      setOrder(data.order);
      setRefundAmount("");
      setRefundReason("");
      toast.success("Refund recorded.");
    } finally {
      setSavingRefund(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't cancel this order.");
        return;
      }
      setOrder(data.order);
      setStatusValue(data.order.status);
      setConfirmCancel(false);
      toast.success("Order cancelled.");
    } finally {
      setCancelling(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderNumber}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteDraft }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't add this note.");
        return;
      }
      setNotes((prev) => [data.note, ...prev]);
      setNoteDraft("");
    } finally {
      setAddingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  if (!order) {
    return <p className="py-16 text-center text-sm text-stone">We couldn&apos;t find that order.</p>;
  }

  const payment = getPaymentStatusLabel(order.status);
  const supportMailto = `mailto:${order.customerEmail}?subject=${encodeURIComponent(`Regarding your order ${order.orderNumber}`)}`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-charcoal">{order.orderNumber}</h1>
            <Badge variant={badgeVariantFor(payment.tone)}>{payment.label}</Badge>
          </div>
          <p className="mt-1.5 text-sm text-stone">
            Placed {new Date(order.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <a href={supportMailto} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            <Mail className="h-4 w-4" /> Contact customer
          </a>
          <Link href={`/admin/orders/${order.orderNumber}/invoice`} target="_blank" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            <FileText className="h-4 w-4" /> Invoice
          </Link>
          <Link href={`/admin/orders/${order.orderNumber}/packing-slip`} target="_blank" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
            <Printer className="h-4 w-4" /> Packing slip
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-sand p-5">
            <h2 className="font-display text-lg text-charcoal">Customer</h2>
            <p className="mt-2 text-sm text-charcoal">{order.customerName}</p>
            <p className="text-sm text-stone">{order.customerEmail}</p>
            {order.isGuest && <Badge variant="neutral" className="mt-2">Guest checkout</Badge>}
          </div>

          <div className="grid gap-6 rounded-2xl border border-sand p-5 sm:grid-cols-2">
            <AddressBlock title="Billing address" address={order.billingAddress} />
            <AddressBlock title="Delivery address" address={order.deliveryAddress} />
          </div>

          <div className="rounded-2xl border border-sand p-5">
            <h2 className="font-display text-lg text-charcoal">Items</h2>
            <div className="mt-3 flex flex-col divide-y divide-sand">
              {order.lines.map((line) => (
                <div key={`${line.productId}-${line.variantLabel ?? ""}`} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-charcoal">
                      {line.name}
                      {line.variantLabel ? ` — ${line.variantLabel}` : ""}
                    </p>
                    <p className="text-xs text-stone">
                      SKU {line.sku} · Qty {line.quantity}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-medium text-charcoal">{formatPrice(line.lineTotal)}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-col gap-1.5 border-t border-sand pt-4 text-sm">
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
              <div className="flex justify-between border-t border-sand pt-1.5 text-base font-medium">
                <span className="text-charcoal">Total</span>
                <span className="text-charcoal">{formatPrice(order.total)}</span>
              </div>
              {order.refundAmount !== undefined && (
                <div className="flex justify-between text-error">
                  <span>Refunded{order.refundReason ? ` (${order.refundReason})` : ""}</span>
                  <span>-{formatPrice(order.refundAmount)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-sand p-5">
            <h2 className="font-display text-lg text-charcoal">Internal notes</h2>
            <p className="mt-1 text-xs text-stone">Only visible to admin staff, never shown to the customer.</p>
            <form onSubmit={handleAddNote} className="mt-3 flex flex-col gap-2">
              <Textarea
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="e.g. Called customer re: delayed delivery"
                className="min-h-20"
              />
              <Button type="submit" size="sm" disabled={addingNote} className="w-fit">
                {addingNote && <Loader2 className="h-4 w-4 animate-spin" />}
                Add note
              </Button>
            </form>
            {notes.length > 0 && (
              <ul className="mt-4 flex flex-col gap-3 border-t border-sand pt-4">
                {notes.map((note) => (
                  <li key={note.id} className="text-sm">
                    <p className="text-charcoal">{note.note}</p>
                    <p className="mt-0.5 text-xs text-stone">
                      {note.authorEmail} · {new Date(note.createdAt).toLocaleString("en-ZA")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-sand p-5">
            <h2 className="font-display text-lg text-charcoal">Status</h2>
            <div className="mt-3 flex flex-col gap-3">
              <Select value={statusValue} onChange={(e) => setStatusValue(e.target.value as OrderStatus)}>
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </Select>
              <Button type="button" size="sm" onClick={handleStatusUpdate} disabled={savingStatus || statusValue === order.status}>
                {savingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
                Update status
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-sand p-5">
            <h2 className="font-display text-lg text-charcoal">Tracking</h2>
            <form onSubmit={handleTrackingSave} className="mt-3 flex flex-col gap-3">
              <div>
                <Label htmlFor="tracking-carrier">Carrier</Label>
                <Input id="tracking-carrier" value={trackingCarrier} onChange={(e) => setTrackingCarrier(e.target.value)} placeholder="e.g. The Courier Guy" />
              </div>
              <div>
                <Label htmlFor="tracking-number">Tracking number</Label>
                <Input id="tracking-number" value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="tracking-url">Tracking URL</Label>
                <Input id="tracking-url" value={trackingUrl} onChange={(e) => setTrackingUrl(e.target.value)} placeholder="Optional" />
              </div>
              <Button type="submit" size="sm" disabled={savingTracking}>
                {savingTracking && <Loader2 className="h-4 w-4 animate-spin" />}
                Save tracking
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-sand p-5">
            <h2 className="font-display text-lg text-charcoal">Refund</h2>
            <form onSubmit={handleRefund} className="mt-3 flex flex-col gap-3">
              <div>
                <Label htmlFor="refund-amount">Amount (ZAR)</Label>
                <Input
                  id="refund-amount"
                  type="number"
                  inputMode="decimal"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  placeholder={`Up to ${formatPrice(order.total)}`}
                />
              </div>
              <div>
                <Label htmlFor="refund-reason">Reason</Label>
                <Input id="refund-reason" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} placeholder="Optional" />
              </div>
              <Button type="submit" size="sm" variant="secondary" disabled={savingRefund}>
                {savingRefund && <Loader2 className="h-4 w-4 animate-spin" />}
                Record refund
              </Button>
            </form>
          </div>

          {order.status !== "cancelled" && (
            <div className="rounded-2xl border border-error/30 p-5">
              <h2 className="font-display text-lg text-charcoal">Cancel order</h2>
              <p className="mt-1 text-xs text-stone">This can&apos;t be undone.</p>
              <div className="mt-3">
                <Label htmlFor="cancel-reason">Reason</Label>
                <Input id="cancel-reason" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Optional" />
              </div>
              <Button
                type="button"
                size="sm"
                className="mt-3 bg-error hover:bg-error/90"
                onClick={() => setConfirmCancel(true)}
              >
                Cancel order
              </Button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Cancel this order?"
        description="The customer isn't automatically notified — contact them separately if needed."
        confirmLabel="Cancel order"
        destructive
        loading={cancelling}
      />
    </div>
  );
}
