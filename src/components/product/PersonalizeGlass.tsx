"use client";

import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import type { CartLinePersonalization } from "@/store/cart-store";

const NAME_MAX_LENGTH = 40;
const MESSAGE_MAX_LENGTH = 60;

/**
 * Optional personalization step shown on glassware product pages — mirrors
 * how the glass is actually etched to order: a name or initials, an
 * optional short title/message, and an optional date. Captured as-is and
 * carried through to the order line for fulfillment staff to read (see
 * cart-store.ts's CartLinePersonalization and db/orders.ts). Never
 * processed automatically, never priced, never gated behind review.
 */
export function PersonalizeGlass({
  value,
  onChange,
}: {
  value: CartLinePersonalization;
  onChange: (value: CartLinePersonalization) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-sand p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone">
        Personalize your glass (optional)
      </p>

      <div>
        <Label htmlFor="personalize-name">Name or initials</Label>
        <Input
          id="personalize-name"
          value={value.nameOrInitials ?? ""}
          onChange={(e) => onChange({ ...value, nameOrInitials: e.target.value.slice(0, NAME_MAX_LENGTH) })}
          placeholder="e.g. Sarah or S.M."
          maxLength={NAME_MAX_LENGTH}
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-stone">
          {(value.nameOrInitials ?? "").length}/{NAME_MAX_LENGTH} characters
        </p>
      </div>

      <div>
        <Label htmlFor="personalize-message">Short title or message (optional)</Label>
        <Input
          id="personalize-message"
          value={value.message ?? ""}
          onChange={(e) => onChange({ ...value, message: e.target.value.slice(0, MESSAGE_MAX_LENGTH) })}
          placeholder="e.g. Private Reserve"
          maxLength={MESSAGE_MAX_LENGTH}
          className="mt-1.5"
        />
        <p className="mt-1 text-xs text-stone">
          {(value.message ?? "").length}/{MESSAGE_MAX_LENGTH} characters
        </p>
      </div>

      <div>
        <Label htmlFor="personalize-date">Date (optional)</Label>
        <Input
          id="personalize-date"
          type="date"
          value={value.date ?? ""}
          onChange={(e) => onChange({ ...value, date: e.target.value || undefined })}
          className="mt-1.5"
        />
      </div>

      <p className="text-xs text-stone">
        Etched exactly as entered — it won&rsquo;t change the price or delay dispatch.
      </p>
    </div>
  );
}
