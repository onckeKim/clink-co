"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputProps } from "@/components/ui/Input";

const PasswordInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false);
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <div>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? "text" : "password"}
            className={cn(
              "focus-ring h-11 w-full rounded-full border bg-white px-5 pr-12 text-sm text-charcoal placeholder:text-stone/60 transition-colors",
              error ? "border-error" : "border-sand focus-visible:border-charcoal",
              className,
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? [errorId, ariaDescribedBy].filter(Boolean).join(" ") : ariaDescribedBy}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            className="focus-ring absolute inset-y-0 right-4 flex items-center text-stone transition-colors hover:text-charcoal"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-error">
            {error}
          </p>
        )}
      </div>
    );
  },
);
PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
