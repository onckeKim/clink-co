"use client";

import * as React from "react";
import { ImagePlus, X } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { CartLinePersonalization } from "@/store/cart-store";

const MAX_TEXT_LENGTH = 60;

/**
 * Optional personalization step shown on glassware product pages — custom
 * wording plus a reference photo, both captured as-is and carried through
 * to the order line for fulfillment staff to read (see cart-store.ts's
 * CartLinePersonalization and db/orders.ts). Never processed automatically,
 * never priced, never gated behind review.
 */
export function PersonalizeGlass({
  value,
  onChange,
}: {
  value: CartLinePersonalization;
  onChange: (value: CartLinePersonalization) => void;
}) {
  const handleFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange({ ...value, imageDataUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sand p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone">
        Personalize your glass (optional)
      </p>

      <div>
        <Label htmlFor="personalize-text">Custom wording</Label>
        <Input
          id="personalize-text"
          value={value.text ?? ""}
          onChange={(e) => onChange({ ...value, text: e.target.value.slice(0, MAX_TEXT_LENGTH) })}
          placeholder="e.g. a name, initials, or a short toast"
          maxLength={MAX_TEXT_LENGTH}
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-stone">
          {(value.text ?? "").length}/{MAX_TEXT_LENGTH} characters
        </p>
      </div>

      <div>
        <Label>Reference photo (optional)</Label>
        <div className="mt-1.5">
          {value.imageDataUrl ? (
            <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-sand">
              {/* eslint-disable-next-line @next/next/no-img-element -- a locally-read data URL, not an optimizable remote asset */}
              <img src={value.imageDataUrl} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange({ ...value, imageDataUrl: undefined })}
                aria-label="Remove photo"
                className="focus-ring absolute right-0 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal/70 text-warm-white"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <label className="focus-ring flex h-16 w-16 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-sand text-stone transition-colors hover:border-charcoal/40">
              <ImagePlus className="h-4 w-4" />
              <span className="text-[10px]">Add</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>
      </div>

      <p className="text-xs text-stone">
        We&rsquo;ll use this as a reference when hand-finishing your glass — it won&rsquo;t change the price or
        delay dispatch.
      </p>
    </div>
  );
}
