import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, id, "aria-describedby": ariaDescribedBy, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = `${textareaId}-error`;

    return (
      <>
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            "focus-ring min-h-32 w-full rounded-2xl border bg-white px-5 py-4 text-sm text-charcoal placeholder:text-stone/60 transition-colors",
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
Textarea.displayName = "Textarea";

export { Textarea };
