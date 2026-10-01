"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BarDatum {
  label: string;
  value: number;
  /** Per-bar color override — used for status semantics (order-status distribution); omit for a single-hue magnitude comparison (bestsellers), where `color` supplies one hue for every bar. */
  color?: string;
}

/**
 * Horizontal bar list — the recommended form for both "compare magnitude"
 * and "part-to-whole" jobs with long category names (see the dataviz
 * skill's choosing-a-form guidance). Each bar is its own hit target with a
 * hover/focus tooltip; the label always sits beside the bar, so identity
 * never depends on color alone even when bars carry status semantics.
 */
export function HorizontalBarChart({
  data,
  formatValue = (v) => v.toLocaleString("en-ZA"),
  color = "#1c1c1a",
}: {
  data: BarDatum[];
  formatValue?: (value: number) => string;
  color?: string;
}) {
  const [hoverLabel, setHoverLabel] = React.useState<string | null>(null);
  const maxValue = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-stone">No data yet.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((d) => {
        const widthPercent = Math.max(2, (d.value / maxValue) * 100);
        const barColor = d.color ?? color;
        return (
          <div key={d.label} className="flex items-center gap-3">
            <p className="w-32 shrink-0 truncate text-xs text-stone" title={d.label}>
              {d.label}
            </p>
            <div
              className="relative h-6 flex-1 cursor-default rounded-full bg-soft-grey/60"
              onPointerEnter={() => setHoverLabel(d.label)}
              onPointerLeave={() => setHoverLabel((current) => (current === d.label ? null : current))}
              onFocus={() => setHoverLabel(d.label)}
              onBlur={() => setHoverLabel((current) => (current === d.label ? null : current))}
              tabIndex={0}
              role="img"
              aria-label={`${d.label}: ${formatValue(d.value)}`}
            >
              <div
                className={cn("h-full rounded-full transition-[width] duration-300", hoverLabel === d.label && "opacity-90")}
                style={{ width: `${widthPercent}%`, backgroundColor: barColor }}
              />
            </div>
            <p className="w-16 shrink-0 text-right text-xs font-medium tabular-nums text-charcoal">{formatValue(d.value)}</p>
          </div>
        );
      })}
    </div>
  );
}
