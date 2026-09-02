import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Rating({
  value,
  count,
  size = "sm",
  inverse = false,
  className,
}: {
  value: number;
  count?: number;
  size?: "xs" | "sm" | "md";
  /** Light-on-dark styling for the review count, for use on dark sections. */
  inverse?: boolean;
  className?: string;
}) {
  const sizeClass = { xs: "h-3 w-3", sm: "h-3.5 w-3.5", md: "h-4 w-4" }[size];
  const filledStars = Math.round(value);

  return (
    <div
      className={cn("flex items-center gap-1.5", className)}
      role="img"
      aria-label={`Rated ${value} out of 5 stars${count !== undefined ? `, ${count} reviews` : ""}`}
    >
      <div className="flex" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              sizeClass,
              i < filledStars ? "fill-champagne text-champagne" : "fill-transparent text-sand",
            )}
            strokeWidth={1.5}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className={cn("text-xs", inverse ? "text-warm-white/50" : "text-stone")}>({count})</span>
      )}
    </div>
  );
}
