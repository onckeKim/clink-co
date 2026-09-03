import type { StoreSettings } from "@/types/settings";
import { settingsSeed } from "@/data/settings-seed";

/**
 * In-memory store settings — a singleton document (there's only ever one
 * store's settings), same rationale as the other admin stores. Every place
 * that used to read a hardcoded value from src/config/site.ts (or a sibling
 * config file) for something in this list now calls `getStoreSettings()`
 * instead, so an admin edit here reaches the storefront without a
 * redeploy. src/config/site.ts itself stays as the seed/fallback and for
 * the handful of genuinely static values (site URL, locale, tagline) that
 * aren't exposed as admin settings.
 */

let settings: StoreSettings = structuredClone(settingsSeed);

export function getStoreSettings(): StoreSettings {
  return settings;
}

export function updateStoreSettings(patch: Partial<Omit<StoreSettings, "social">> & { social?: Partial<StoreSettings["social"]> }): StoreSettings {
  settings = {
    ...settings,
    ...patch,
    social: patch.social ? { ...settings.social, ...patch.social } : settings.social,
  };
  return settings;
}

/** Convenience used by proxy.ts and any full-site maintenance gate — kept as a named export so the middleware only imports the one boolean it needs. */
export function isMaintenanceModeOn(): boolean {
  return settings.maintenanceMode;
}
