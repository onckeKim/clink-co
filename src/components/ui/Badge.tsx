import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        dark: "bg-charcoal text-warm-white",
        light: "bg-warm-white text-charcoal border border-charcoal/10",
        sale: "bg-error text-warm-white",
        outline: "border border-current text-charcoal bg-transparent",
        champagne: "bg-champagne/25 text-charcoal",
        green: "bg-green/12 text-green",
        success: "bg-success/10 text-success",
        warning: "bg-champagne/25 text-charcoal",
        error: "bg-error/10 text-error",
        neutral: "bg-soft-grey text-stone",
      },
    },
    defaultVariants: {
      variant: "dark",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

export { Badge, badgeVariants };
