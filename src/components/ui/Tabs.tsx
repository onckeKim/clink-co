"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  count?: number;
}

/** Simple controlled tab bar (accessible tablist/tab roles) — used for admin list-screen status filters and multi-section forms. Panel rendering is left to the caller (`activeTab === "x" ? ... : null`), matching how the rest of this codebase composes state rather than hiding it behind a compound-component API. */
export function Tabs({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div role="tablist" className={cn("flex flex-wrap gap-2 border-b border-sand", className)}>
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.id)}
            className={cn(
              "focus-ring -mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors",
              active ? "border-charcoal font-medium text-charcoal" : "border-transparent text-stone hover:text-charcoal",
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-xs", active ? "bg-charcoal text-warm-white" : "bg-soft-grey text-stone")}>
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
