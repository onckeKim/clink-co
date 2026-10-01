"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
  max,
  disabled = false,
}: {
  value: number;
  onChange: (value: number) => void;
  /** Upper bound — typically the product's stock quantity. */
  max: number;
  disabled?: boolean;
}) {
  const clamp = (next: number) => Math.min(Math.max(1, next), Math.max(1, max));

  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-stone" id="quantity-label">
        Quantity
      </span>
      <div
        className={cn(
          "inline-flex h-11 w-fit items-center rounded-full border border-sand",
          disabled && "opacity-50",
        )}
      >
        <button
          type="button"
          disabled={disabled || value <= 1}
          onClick={() => onChange(clamp(value - 1))}
          aria-label="Decrease quantity"
          className="focus-ring flex h-full w-10 items-center justify-center rounded-l-full text-charcoal transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span
          role="spinbutton"
          aria-labelledby="quantity-label"
          aria-valuenow={value}
          aria-valuemin={1}
          aria-valuemax={max}
          className="flex h-full w-10 items-center justify-center text-sm font-medium text-charcoal"
        >
          {value}
        </span>
        <button
          type="button"
          disabled={disabled || value >= max}
          onClick={() => onChange(clamp(value + 1))}
          aria-label="Increase quantity"
          className="focus-ring flex h-full w-10 items-center justify-center rounded-r-full text-charcoal transition-colors hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
