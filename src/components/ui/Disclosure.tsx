"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/** A single expandable accordion section — used to build the filter sidebar/drawer's collapsible groups. */
export function Disclosure({
  title,
  children,
  defaultOpen = false,
  className,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  const contentId = React.useId();

  return (
    <div className={cn("border-b border-sand/70 py-4 first:pt-0 last:border-b-0", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={contentId}
        className="focus-ring flex w-full items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-medium text-charcoal">{title}</span>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-stone transition-transform duration-300", open && "rotate-180")}
        />
      </button>
      {open && (
        <div id={contentId} className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
