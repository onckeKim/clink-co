import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
  {
    variants: {
      variant: {
        dark: "bg-ink text-ivory",
        light: "bg-ivory text-ink border border-ink/10",
        sale: "bg-error text-ivory",
        outline: "border border-current text-ink bg-transparent",
        brass: "bg-brass-light/40 text-clay",
        success: "bg-success/10 text-success",
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
