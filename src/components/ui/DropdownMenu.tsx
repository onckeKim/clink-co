"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface DropdownMenuContextValue {
  close: () => void;
}
const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

/** A lightweight trigger+menu dropdown (row actions, "more" menus) — closes on outside click or Escape. Not portaled: simpler and sufficient at the sizes it's used at in this admin UI, but means it can be visually clipped inside an `overflow-x-auto` table wrapper if opened very close to the scroll edge. */
export function DropdownMenu({
  trigger,
  children,
  align = "end",
  className,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu">
        {trigger}
      </button>
      {open && (
        <DropdownMenuContext.Provider value={{ close: () => setOpen(false) }}>
          <div
            role="menu"
            className={cn(
              "absolute z-30 mt-2 min-w-44 rounded-2xl border border-sand bg-warm-white p-1.5 shadow-lifted",
              align === "end" ? "right-0" : "left-0",
              className,
            )}
          >
            {children}
          </div>
        </DropdownMenuContext.Provider>
      )}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  destructive,
  disabled,
  children,
}: {
  onClick?: () => void;
  destructive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(DropdownMenuContext);
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onClick?.();
        ctx?.close();
      }}
      className={cn(
        "focus-ring flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        destructive ? "text-error hover:bg-error/10" : "text-charcoal hover:bg-porcelain",
      )}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-1.5 h-px bg-sand" />;
}
