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
              inverse ? "text-ivory/50" : "text-clay",
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            "font-display text-3xl font-medium sm:text-4xl",
            inverse ? "text-ivory" : "text-ink",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className={cn("mt-3 text-sm leading-relaxed", inverse ? "text-ivory/60" : "text-clay")}>
            {description}
          </p>
        )}
      </div>

      {cta && (
        <Link
          href={cta.href}
          className={cn(
            "focus-ring group inline-flex shrink-0 items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
            inverse
              ? "border-ivory/30 text-ivory hover:bg-ivory hover:text-ink"
              : "border-ink/20 text-ink hover:bg-ink hover:text-ivory",
          )}
        >
          {cta.label}
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </div>
  );
}
