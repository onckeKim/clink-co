"use client";

import * as React from "react";
import type { StoreSettings } from "@/types/settings";

/**
 * Makes the store settings fetched once, server-side, in the root layout
 * available to client components that need them mid-render (CartSummary,
 * CheckoutView, DeliveryEstimator, DeliveryMethodStep, InvoiceView,
 * OrderDetailView, ProductDetailView) — those can't `await` a Supabase call
 * themselves. No client-side fetch, no loading state: the value is already
 * resolved by the time this provider mounts.
 */
const StoreSettingsContext = React.createContext<StoreSettings | null>(null);

export function StoreSettingsProvider({
  settings,
  children,
}: {
  settings: StoreSettings;
  children: React.ReactNode;
}) {
  return <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>;
}

/** Throws if called outside StoreSettingsProvider — every client component that needs settings renders under the root layout, so a missing provider means a real wiring bug, not a legitimate "no settings yet" state. */
export function useStoreSettings(): StoreSettings {
  const settings = React.useContext(StoreSettingsContext);
  if (!settings) throw new Error("useStoreSettings() called outside <StoreSettingsProvider>.");
  return settings;
}
