"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ checked, onCheckedChange, id, disabled, ...aria }, ref) => {
    return (
      <button
        ref={ref}
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          "focus-ring flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
          checked ? "border-charcoal bg-charcoal" : "border-stone bg-transparent",
          disabled && "cursor-not-allowed opacity-50",
        )}
        {...aria}
      >
        {checked && <Check className="h-3.5 w-3.5 text-warm-white" strokeWidth={3} />}
      </button>
    );
  },
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
