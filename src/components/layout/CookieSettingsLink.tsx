"use client";

import { useConsentStore } from "@/store/consent-store";

/** Lets a visitor who already made a cookie choice reopen the banner to change it. */
export function CookieSettingsLink({ className }: { className?: string }) {
  const reset = useConsentStore((state) => state.reset);
  return (
    <button type="button" onClick={reset} className={className}>
      Cookie Settings
    </button>
  );
}
