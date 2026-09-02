import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className, inverse = false }: { className?: string; inverse?: boolean }) {
  return (
    <Link
      href="/"
      className={cn(
        "focus-ring flex flex-col leading-none",
        inverse ? "text-ivory" : "text-ink",
        className,
      )}
      aria-label="Clink & Co home"
    >
      <span className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
        CLINK <span className="italic">&amp;</span> CO
      </span>
      <span
        className={cn(
          "mt-0.5 text-[10px] font-medium uppercase tracking-[0.25em]",
          inverse ? "text-ivory/60" : "text-clay",
        )}
      >
        by Heimsight
      </span>
    </Link>
  );
}
