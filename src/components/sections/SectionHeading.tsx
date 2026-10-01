import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  description,
  cta,
  inverse = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  cta?: { label: string; href: string };
  inverse?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end", className)}>
      <div className="max-w-xl">
        {eyebrow && (
          <p
            className={cn(
              "mb-3 text-xs font-semibold uppercase tracking-[0.2em]",
              inverse ? "text-warm-white/50" : "text-stone",
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            "font-display text-display-xl font-medium",
            inverse ? "text-warm-white" : "text-charcoal",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-3 text-sm leading-relaxed", inverse ? "text-warm-white/60" : "text-stone")}>
            {description}
          </p>
        )}
      </div>

      {cta && (
        <Link
          href={cta.href}
          {...(cta.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
          className={cn(
            "focus-ring group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
            inverse
              ? "border-warm-white/30 text-warm-white hover:bg-warm-white hover:text-charcoal"
              : "border-charcoal/20 text-charcoal hover:bg-charcoal hover:text-warm-white",
          )}
        >
          {cta.label}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </div>
  );
}
