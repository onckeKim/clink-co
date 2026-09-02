import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "focus-ring min-h-32 w-full rounded-2xl border bg-white px-5 py-4 text-sm text-charcoal placeholder:text-stone/60 transition-colors",
          error ? "border-error" : "border-sand focus-visible:border-charcoal",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";

export { Textarea };
