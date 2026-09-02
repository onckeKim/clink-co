import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "focus-ring h-11 w-full rounded-full border bg-white px-5 text-sm text-ink placeholder:text-clay/60 transition-colors",
          error ? "border-error" : "border-sand focus-visible:border-ink",
          className,
        )}
        aria-invalid={Boolean(error)}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
