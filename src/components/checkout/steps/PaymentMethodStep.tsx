"use client";

import { CreditCard, Landmark } from "lucide-react";
import type { PaymentMethodId } from "@/lib/orders/types";
import { eftBankDetails } from "@/config/payments";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface PaymentMethodOption {
  id: PaymentMethodId;
  label: string;
  description: string;
}

export function PaymentMethodStep({
  availableMethods,
  loading,
  selectedMethod,
  onSelect,
  onBack,
  onNext,
}: {
  availableMethods: PaymentMethodOption[];
  loading: boolean;
  selectedMethod?: PaymentMethodId;
  onSelect: (id: PaymentMethodId) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-display text-xl text-charcoal">Payment Method</h2>

      {loading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-sand/40" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {availableMethods.map((method) => {
            const selected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onSelect(method.id)}
                aria-pressed={selected}
                className={cn(
                  "focus-ring flex items-start gap-3 rounded-2xl border p-4 text-left transition-colors",
                  selected ? "border-charcoal bg-porcelain" : "border-sand hover:border-charcoal/40",
                )}
              >
                {method.id === "eft" ? (
                  <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                ) : (
                  <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                )}
                <div>
                  <p className="text-sm font-medium text-charcoal">{method.label}</p>
                  <p className="text-xs text-stone">{method.description}</p>
                </div>
              </button>
            );
          })}
          {availableMethods.length === 0 && (
            <p className="text-sm text-stone">
              No payment methods are currently available. Please contact us to complete your order.
            </p>
          )}
        </div>
      )}

      {selectedMethod === "eft" && (
        <div className="rounded-2xl bg-porcelain p-4 text-sm text-stone">
          <p className="font-medium text-charcoal">Bank transfer details</p>
          <p className="mt-2">Account name: {eftBankDetails.accountName}</p>
          <p>Bank: {eftBankDetails.bank}</p>
          <p>Account number: {eftBankDetails.accountNumber}</p>
          <p>Branch code: {eftBankDetails.branchCode}</p>
          <p className="mt-2 text-xs">
            You&apos;ll receive your unique order reference to use as your payment reference once you place
            your order.
          </p>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button type="button" variant="secondary" size="lg" onClick={onBack}>
          Back
        </Button>
        <Button type="button" size="lg" disabled={!selectedMethod} onClick={onNext}>
          Continue to review
        </Button>
      </div>
    </div>
  );
}
