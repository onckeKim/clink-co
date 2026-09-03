import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  href,
  tone = "neutral",
  className,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  href?: string;
  tone?: "neutral" | "warning" | "error";
  className?: string;
}) {
  const content = (
    <Card className={cn("flex items-start justify-between gap-3 p-5", href && "transition-colors hover:border-charcoal/30", className)}>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-stone">{label}</p>
        <p
          className={cn(
            "font-display mt-2 text-2xl text-charcoal",
            tone === "warning" && "text-champagne-ink",
            tone === "error" && "text-error",
          )}
        >
          {value}
        </p>
      </div>
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 text-stone",
          tone === "warning" && "text-champagne",
          tone === "error" && "text-error",
        )}
        strokeWidth={1.5}
      />
    </Card>
  );

  if (!href) return content;
  return (
    <Link href={href} className="focus-ring block rounded-2xl">
      {content}
    </Link>
  );
}
