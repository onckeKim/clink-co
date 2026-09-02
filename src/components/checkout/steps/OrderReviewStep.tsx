"use client";

import * as React from "react";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import type { CartLine } from "@/store/cart-store";
import type { AddressInput, CustomerDetailsInput } from "@/lib/validations/checkout";
import { Checkbox } from "@/components/ui/Checkbox";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

function AddressSummary({ address }: { address: AddressInput }) {
  return (
    <p className="text-sm leading-relaxed text-stone">
      {address.fullName}
      <br />
      {address.line1}
      {address.line2 ? `, ${address.line2}` : ""}
      <br />
      {address.suburb}, {address.city}
      <br />
      {address.province} {address.postalCode}
      <br />
      {address.phone}
    </p>
  );
}

export function OrderReviewStep({
  lines,
  customer,
  deliveryAddress,
  billingAddress,
  billingSameAsDelivery,
  deliveryMethodLabel,
  paymentMethodLabel,
  shippingNotes,
  giftMessage,
  subtotal,
  discountAmount,
  couponCode,
  deliveryFee,
  taxAmount,
  total,
  submitting,
  errorMessage,
  onBack,
  onEditStep,
  onPlaceOrder,
}: {
  lines: CartLine[];
  customer: CustomerDetailsInput;
  deliveryAddress: AddressInput;
  billingAddress: AddressInput;
  billingSameAsDelivery: boolean;
  deliveryMethodLabel: string;
  paymentMethodLabel: string;
  shippingNotes?: string;
  giftMessage?: string;
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  deliveryFee: number;
  taxAmount: number;
  total: number;
  submitting: boolean;
  errorMessage?: string;
  onBack: () => void;
  onEditStep: (step: number) => void;
  onPlaceOrder: (termsAccepted: boolean) => void;
}) {
  const [termsAccepted, setTermsAccepted] = React.useState(false);
  const [attempted, setAttempted] = React.useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setAttempted(true);
    if (!termsAccepted) return;
    onPlaceOrder(termsAccepted);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <h2 className="font-display text-xl text-charcoal">Order Review</h2>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-stone">Items</p>
        <ul className="divide-y divide-sand rounded-2xl border border-sand">
          {lines.map((line) => (
            <li key={line.lineId} className="flex items-center gap-3 p-3">
              <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-sand/50">
                <Image src={line.image} alt={line.name} fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-charcoal">{line.name}</p>
                <p className="text-xs text-stone">
                  {line.variant ? `${line.variant.label} · ` : ""}
                  Qty {line.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-charcoal">{formatPrice(line.price * line.quantity)}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Contact</p>
            <button type="button" onClick={() => onEditStep(0)} className="focus-ring text-xs underline-offset-2 hover:underline">
              Edit
            </button>
          </div>
          <p className="text-sm leading-relaxed text-stone">
            {customer.firstName} {customer.lastName}
            <br />
            {customer.email}
            <br />
            {customer.phone}
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Delivery address</p>
            <button type="button" onClick={() => onEditStep(1)} className="focus-ring text-xs underline-offset-2 hover:underline">
              Edit
            </button>
          </div>
          <AddressSummary address={deliveryAddress} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Delivery method</p>
            <button type="button" onClick={() => onEditStep(2)} className="focus-ring text-xs underline-offset-2 hover:underline">
              Edit
            </button>
          </div>
          <p className="text-sm text-stone">{deliveryMethodLabel}</p>
          {shippingNotes && <p className="mt-1 text-xs text-stone">Note: {shippingNotes}</p>}
          {giftMessage && <p className="mt-1 text-xs text-stone">Gift message: &ldquo;{giftMessage}&rdquo;</p>}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Billing address</p>
            <button type="button" onClick={() => onEditStep(3)} className="focus-ring text-xs underline-offset-2 hover:underline">
              Edit
            </button>
          </div>
          {billingSameAsDelivery ? (
            <p className="text-sm text-stone">Same as delivery address</p>
          ) : (
            <AddressSummary address={billingAddress} />
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone">Payment method</p>
            <button type="button" onClick={() => onEditStep(4)} className="focus-ring text-xs underline-offset-2 hover:underline">
              Edit
            </button>
          </div>
          <p className="text-sm text-stone">{paymentMethodLabel}</p>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-2xl border border-sand p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-stone">Subtotal</span>
          <span className="text-charcoal">{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between text-success">
            <span>Discount{couponCode ? ` (${couponCode})` : ""}</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-stone">Delivery</span>
          <span className="text-charcoal">{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-stone">
          <span>Includes VAT</span>
          <span>{formatPrice(taxAmount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-sand pt-2 text-base font-medium">
          <span className="text-charcoal">Total</span>
          <span className="text-charcoal">{formatPrice(total)}</span>
        </div>
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-charcoal">
          <Checkbox checked={termsAccepted} onCheckedChange={setTermsAccepted} aria-invalid={attempted && !termsAccepted} />
          I agree to the{" "}
          <a href="/terms" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Privacy Policy
          </a>
          .
        </label>
        {attempted && !termsAccepted && (
          <p className="mt-1.5 text-xs text-error">You must accept the terms to place your order.</p>
        )}
      </div>

      <p className="flex items-center gap-1.5 text-xs text-stone">
        <ShieldCheck className="h-3.5 w-3.5" />
        Secure checkout — your details are encrypted in transit and never stored on our servers.
      </p>

      {errorMessage && <p className="text-sm text-error">{errorMessage}</p>}

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack} disabled={submitting}>
          Back
        </Button>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? "Placing order…" : "Place order"}
        </Button>
      </div>
    </form>
  );
}
