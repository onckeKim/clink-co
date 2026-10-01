"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import type { AdminCustomerSummary } from "@/lib/admin/customers-store";
import type { CustomerNote } from "@/lib/admin/customer-notes-store";
import type { Order } from "@/lib/orders/types";
import { getPaymentStatusLabel } from "@/lib/orders/status";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Switch } from "@/components/ui/Switch";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { formatPrice } from "@/lib/utils";

function badgeVariantFor(tone: ReturnType<typeof getPaymentStatusLabel>["tone"]) {
  if (tone === "success") return "success" as const;
  if (tone === "error") return "error" as const;
  if (tone === "warning") return "warning" as const;
  return "neutral" as const;
}

export function AdminCustomerDetailView({ customerId }: { customerId: string }) {
  const [customer, setCustomer] = React.useState<AdminCustomerSummary | null>(null);
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [notes, setNotes] = React.useState<CustomerNote[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [savingConsent, setSavingConsent] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState("");
  const [addingNote, setAddingNote] = React.useState(false);
  const [disableReason, setDisableReason] = React.useState("");
  const [confirmDisable, setConfirmDisable] = React.useState(false);
  const [savingDisable, setSavingDisable] = React.useState(false);

  const load = React.useCallback(() => {
    fetch(`/api/admin/customers/${customerId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { customer?: AdminCustomerSummary } | null) => {
        if (!data?.customer) {
          setLoading(false);
          return;
        }
        setCustomer(data.customer);
        return fetch(`/api/admin/orders?search=${encodeURIComponent(data.customer.email ?? "")}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((orderData: { orders?: Order[] } | null) => setOrders(orderData?.orders ?? []));
      })
      .finally(() => setLoading(false));

    fetch(`/api/admin/customers/${customerId}/notes`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { notes?: CustomerNote[] } | null) => setNotes(data?.notes ?? []));
  }, [customerId]);

  React.useEffect(load, [load]);

  const toggleConsent = async (checked: boolean) => {
    setSavingConsent(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketingConsent: checked }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't update marketing consent.");
        return;
      }
      setCustomer(data.customer);
      toast.success("Marketing consent updated.");
    } finally {
      setSavingConsent(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    setAddingNote(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/notes`, {
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

  const handleDisableToggle = async () => {
    if (!customer) return;
    const nextDisabled = !customer.isDisabled;
    if (nextDisabled && !disableReason.trim()) {
      toast.error("A reason is required to disable an account.");
      return;
    }
    setSavingDisable(true);
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/disable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDisabled: nextDisabled, reason: nextDisabled ? disableReason : undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't update this account.");
        return;
      }
      setCustomer(data.customer);
      setConfirmDisable(false);
      setDisableReason("");
      toast.success(nextDisabled ? "Account disabled." : "Account re-enabled.");
    } finally {
      setSavingDisable(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  if (!customer) {
    return <p className="py-16 text-center text-sm text-stone">We couldn&apos;t find that customer.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl text-charcoal">
              {customer.firstName} {customer.lastName}
            </h1>
            {customer.isDisabled ? <Badge variant="error">Disabled</Badge> : <Badge variant="success">Active</Badge>}
          </div>
          <p className="mt-1.5 text-sm text-stone">{customer.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-sand p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone">Total spend</p>
          <p className="font-display mt-2 text-2xl text-charcoal">{formatPrice(customer.totalSpend)}</p>
        </div>
        <div className="rounded-2xl border border-sand p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone">Orders</p>
          <p className="font-display mt-2 text-2xl text-charcoal">{customer.orderCount}</p>
        </div>
        <div className="rounded-2xl border border-sand p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-stone">Customer since</p>
          <p className="font-display mt-2 text-2xl text-charcoal">
            {new Date(customer.createdAt).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="rounded-2xl border border-sand p-5">
            <h2 className="font-display text-lg text-charcoal">Order history</h2>
            {orders.length === 0 ? (
              <p className="mt-3 text-sm text-stone">No orders yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-sand">
                {orders.map((order) => {
                  const payment = getPaymentStatusLabel(order.status);
                  return (
                    <li key={order.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <Link
                          href={`/admin/orders/${order.orderNumber}`}
                          className="text-sm font-medium text-charcoal underline-offset-2 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="text-xs text-stone">
                          {new Date(order.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={badgeVariantFor(payment.tone)}>{payment.label}</Badge>
                        <span className="text-sm font-medium text-charcoal">{formatPrice(order.total)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-sand p-5">
            <h2 className="font-display text-lg text-charcoal">Internal notes</h2>
            <p className="mt-1 text-xs text-stone">Only visible to admin staff, never shown to the customer.</p>
            <form onSubmit={handleAddNote} className="mt-3 flex flex-col gap-2">
              <Textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} placeholder="Add a note about this customer" className="min-h-20" />
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
            <h2 className="font-display text-lg text-charcoal">Marketing</h2>
            <div className="mt-3 flex items-center gap-3">
              <Switch checked={customer.marketingConsent} onCheckedChange={toggleConsent} disabled={savingConsent} id="marketing-consent" />
              <Label htmlFor="marketing-consent" className="mb-0 normal-case tracking-normal text-charcoal">
                Subscribed to marketing emails
              </Label>
            </div>
          </div>

          <div className={`rounded-2xl border p-5 ${customer.isDisabled ? "border-sand" : "border-error/30"}`}>
            <h2 className="font-display text-lg text-charcoal">{customer.isDisabled ? "Account disabled" : "Disable account"}</h2>
            {customer.isDisabled ? (
              <>
                <p className="mt-2 text-sm text-stone">Reason: {customer.disabledReason ?? "—"}</p>
                <Button type="button" size="sm" variant="secondary" className="mt-3" onClick={handleDisableToggle} disabled={savingDisable}>
                  {savingDisable && <Loader2 className="h-4 w-4 animate-spin" />}
                  Re-enable account
                </Button>
              </>
            ) : (
              <>
                <p className="mt-1 text-xs text-stone">Blocks sign-in immediately. Never deletes the account or its history.</p>
                <div className="mt-3">
                  <Label htmlFor="disable-reason">Reason</Label>
                  <Input id="disable-reason" value={disableReason} onChange={(e) => setDisableReason(e.target.value)} placeholder="Required" />
                </div>
                <Button type="button" size="sm" className="mt-3 bg-error hover:bg-error/90" onClick={() => setConfirmDisable(true)}>
                  Disable account
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDisable}
        onClose={() => setConfirmDisable(false)}
        onConfirm={handleDisableToggle}
        title="Disable this account?"
        description="They won't be able to sign in until re-enabled."
        confirmLabel="Disable account"
        destructive
        loading={savingDisable}
      />
    </div>
  );
}
