"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, PackageX, Clock } from "lucide-react";
import { useAuthUser } from "@/lib/hooks/use-auth-user";
import type { Order } from "@/lib/orders/types";
import type { ReturnRequest, ReturnReason } from "@/lib/account/returns-store";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Button, buttonVariants } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { cn, formatPrice } from "@/lib/utils";

const REASON_LABELS: Record<ReturnReason, string> = {
  "changed-mind": "Changed my mind",
  damaged: "Item arrived damaged",
  "wrong-item": "Received the wrong item",
  "not-as-described": "Not as described",
  other: "Other",
};

const MAX_EVIDENCE_IMAGES = 4;

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
}

export function ReturnsPageClient() {
  const { user, loading: authLoading } = useAuthUser();
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [returnRequests, setReturnRequests] = React.useState<ReturnRequest[]>([]);
  const [loadingData, setLoadingData] = React.useState(true);

  const loadData = React.useCallback(async () => {
    setLoadingData(true);
    try {
      const [ordersRes, returnsRes] = await Promise.all([fetch("/api/account/orders"), fetch("/api/account/returns")]);
      const ordersBody = await ordersRes.json().catch(() => null);
      const returnsBody = await returnsRes.json().catch(() => null);
      setOrders(ordersRes.ok ? (ordersBody.orders as Order[]) : []);
      setReturnRequests(returnsRes.ok ? (returnsBody.returnRequests as ReturnRequest[]) : []);
    } finally {
      setLoadingData(false);
    }
  }, []);

  React.useEffect(() => {
    if (!user) return;
    const id = window.setTimeout(() => void loadData(), 0);
    return () => window.clearTimeout(id);
  }, [user, loadData]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-sand bg-porcelain p-12">
        <Loader2 className="h-5 w-5 animate-spin text-stone" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl border border-sand bg-porcelain px-6 py-14 text-center">
        <h2 className="font-display text-xl text-charcoal">Sign in to request a return</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-stone">
          Return requests and status tracking are tied to your account and order history.
        </p>
        <Link href="/login?redirect=/returns" className={cn(buttonVariants({ size: "md" }), "mt-5")}>
          Sign in
        </Link>
      </div>
    );
  }

  const requestedOrderNumbers = new Set(returnRequests.map((r) => r.orderNumber));
  const eligibleOrders = orders.filter(
    (order) => (order.status === "paid" || order.status === "fulfilled") && !requestedOrderNumbers.has(order.orderNumber),
  );

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h2 className="font-display text-display-sm text-charcoal">Request a return</h2>
        {loadingData ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-stone">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading your orders…
          </div>
        ) : eligibleOrders.length === 0 ? (
          <p className="mt-3 text-sm leading-relaxed text-stone">
            You don&apos;t have any orders currently eligible for a return. Only paid or delivered orders without an
            existing return request can be returned — check{" "}
            <Link href="/account/orders" className="link-underline text-charcoal">
              your order history
            </Link>{" "}
            for details.
          </p>
        ) : (
          <NewReturnForm orders={eligibleOrders} onSubmitted={loadData} />
        )}
      </section>

      <section>
        <h2 className="font-display text-display-sm text-charcoal">Your return requests</h2>
        {loadingData ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-stone">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : returnRequests.length === 0 ? (
          <div className="mt-4 flex flex-col items-center gap-2 rounded-2xl border border-sand bg-porcelain px-6 py-10 text-center">
            <PackageX className="h-6 w-6 text-stone" />
            <p className="text-sm text-stone">You haven&apos;t requested any returns yet.</p>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-3">
            {returnRequests.map((r) => (
              <div key={r.id} className="rounded-2xl border border-sand p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-charcoal">Order {r.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-stone">
                      {REASON_LABELS[r.reason]} · Requested {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <Badge variant="warning" className="gap-1">
                    <Clock className="h-3 w-3" /> Under review
                  </Badge>
                </div>
                {r.notes && <p className="mt-3 text-sm leading-relaxed text-stone">{r.notes}</p>}
                {r.evidenceImages.length > 0 && (
                  <div className="mt-3 flex gap-2">
                    {r.evidenceImages.map((src, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img key={i} src={src} alt={`Return evidence ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs leading-relaxed text-stone">
                  We&apos;ll email you once your return has been reviewed. Most requests are processed within 2–3
                  business days of us receiving the item back.
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function NewReturnForm({ orders, onSubmitted }: { orders: Order[]; onSubmitted: () => void }) {
  const [orderNumber, setOrderNumber] = React.useState(orders[0]?.orderNumber ?? "");
  const [reason, setReason] = React.useState<ReturnReason>("changed-mind");
  const [notes, setNotes] = React.useState("");
  const [images, setImages] = React.useState<{ file: File; dataUrl: string }[]>([]);
  const [status, setStatus] = React.useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    const room = MAX_EVIDENCE_IMAGES - images.length;
    if (room <= 0) return;
    const toAdd = files.slice(0, room);
    const converted = await Promise.all(toAdd.map(async (file) => ({ file, dataUrl: await fileToDataUrl(file) })));
    setImages((prev) => [...prev, ...converted]);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/account/orders/${orderNumber}/return-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason, notes, evidenceImages: images.map((i) => i.dataUrl) }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setErrorMessage(body?.error ?? "Something went wrong — please try again.");
        setStatus("error");
        return;
      }
      setStatus("success");
      setNotes("");
      setImages([]);
      onSubmitted();
    } catch {
      setErrorMessage("Something went wrong — please check your connection and try again.");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="mt-4 flex flex-col items-center gap-3 rounded-2xl border border-sand bg-porcelain px-6 py-12 text-center">
        <CheckCircle2 className="h-7 w-7 text-success" />
        <h3 className="font-display text-lg text-charcoal">Return request received</h3>
        <p className="max-w-sm text-sm leading-relaxed text-stone">
          We&apos;ve emailed you a confirmation. Our team will review your request and follow up with next steps.
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setStatus("idle")}>
          Request another return
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-5 rounded-2xl border border-sand p-6">
      {status === "error" && (
        <div className="flex items-start gap-2 rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <Label htmlFor="return-order">Order</Label>
        <Select id="return-order" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)}>
          {orders.map((order) => (
            <option key={order.orderNumber} value={order.orderNumber}>
              {order.orderNumber} — {formatDate(order.createdAt)} — {formatPrice(order.lines.reduce((sum, l) => sum + l.lineTotal, 0))}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="return-reason">Reason for return</Label>
        <Select id="return-reason" value={reason} onChange={(e) => setReason(e.target.value as ReturnReason)}>
          {(Object.keys(REASON_LABELS) as ReturnReason[]).map((r) => (
            <option key={r} value={r}>
              {REASON_LABELS[r]}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="return-notes">Additional notes (optional)</Label>
        <Textarea
          id="return-notes"
          rows={4}
          maxLength={500}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Tell us a little more about your return…"
        />
      </div>

      <div>
        <Label>Photos (optional, up to {MAX_EVIDENCE_IMAGES})</Label>
        <p className="mb-2 text-xs text-stone">
          Especially helpful for damaged or not-as-described items — attach photos of the item and packaging.
        </p>
        {images.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.dataUrl} alt={`Evidence ${i + 1}`} className="h-16 w-16 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="focus-ring absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-charcoal text-[10px] text-warm-white"
                  aria-label={`Remove photo ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {images.length < MAX_EVIDENCE_IMAGES && <ImageUploader onFiles={handleFiles} multiple />}
      </div>

      <Button type="submit" disabled={status === "submitting" || !orderNumber} className="w-fit">
        {status === "submitting" && <Loader2 className="h-4 w-4 animate-spin" />}
        Submit Return Request
      </Button>
    </form>
  );
}
