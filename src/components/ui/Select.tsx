import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
}

/** A native `<select>` styled to match `Input` — simplest, most accessible choice for admin forms with many options (roles, statuses, categories, provinces). */
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, id, "aria-describedby": ariaDescribedBy, children, ...props }, ref) => {
    const generatedId = React.useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;

    return (
      <>
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "focus-ring h-11 w-full appearance-none rounded-full border bg-white px-5 pr-11 text-sm text-charcoal transition-colors",
              error ? "border-error" : "border-sand focus-visible:border-charcoal",
              className,
            )}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? [errorId, ariaDescribedBy].filter(Boolean).join(" ") : ariaDescribedBy}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-error">
            {error}
          </p>
        )}
      </>
    );
  },
);
Select.displayName = "Select";

export { Select };
