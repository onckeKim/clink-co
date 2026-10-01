import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
      <>
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "focus-ring h-11 w-full rounded-full border bg-white px-5 text-sm text-charcoal placeholder:text-stone/60 transition-colors",
            error ? "border-error" : "border-sand focus-visible:border-charcoal",
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? [errorId, ariaDescribedBy].filter(Boolean).join(" ") : ariaDescribedBy}
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-error">
            {error}
          </p>
        )}
      </>
    );
  },
);
Input.displayName = "Input";

export { Input };
