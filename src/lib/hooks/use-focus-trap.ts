"use client";

import * as React from "react";

/** Elements a keyboard user can land on — used to find the first focus target and to trap Tab within a dialog/drawer panel. */
const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Standard WAI-ARIA dialog focus behavior for a panel rendered while `open`
 * is true: moves focus into the panel on open, traps Tab/Shift+Tab within
 * it, calls `onClose` on Escape, and restores focus to whatever triggered
 * the dialog once it closes. Callers still own their own body-scroll lock
 * (the two dialogs using this today lock at slightly different times
 * relative to their open/close animation).
 */
export function useFocusTrap(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  React.useEffect(() => {
    if (!open) return;
    const trigger = document.activeElement as HTMLElement | null;
    // Deferred a tick so the panel (and its focusable children) exist in the DOM before we try to focus into it.
    const focusId = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      (first ?? panelRef.current)?.focus();
    }, 0);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(focusId);
      document.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [open, onClose, panelRef]);
}
