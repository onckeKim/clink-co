import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverse = false,
  compact = false,
}: {
  className?: string;
  inverse?: boolean;
  /** Smaller mark with no subtitle — for tight mobile header bars. */
  compact?: boolean;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-ring flex flex-col leading-none",
        inverse ? "text-warm-white" : "text-charcoal",
        className,
      )}
      aria-label="Clink & Co home"
    >
      <span
        className={cn(
          "font-display font-semibold tracking-tight",
          compact ? "text-lg" : "text-xl sm:text-2xl",
        )}
      >
        CLINK <span className="italic">&amp;</span> CO
      </span>
      {!compact && (
        <span
          className={cn(
            "mt-0.5 text-[10px] font-medium uppercase tracking-[0.25em]",
            inverse ? "text-warm-white/60" : "text-stone",
          )}
        >
          by Heimsight
        </span>
      )}
    </Link>
  );
}
