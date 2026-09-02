import type { SouthAfricanProvince } from "@/data/provinces";

/**
 * Configurable delivery options. Values here are the kind of thing an admin
 * dashboard would eventually expose as editable settings (fees, whether
 * pickup is enabled) — see the same rationale in src/config/site.ts.
 */

export type DeliveryMethodId = "standard" | "express" | "pickup";

export interface DeliveryMethodConfig {
  id: DeliveryMethodId;
  label: string;
  description: string;
  /** Base fee in ZAR for a "regional" zone; scaled per zone in src/lib/delivery.ts. Pickup is always free. */
  baseFee: number;
  minDays: number;
  maxDays: number;
  /** When true, only available where `isMethodAvailable()` in src/lib/delivery.ts says so (metro zone / pickup postal codes). */
  restricted: boolean;
}

export const deliveryMethods: DeliveryMethodConfig[] = [
  {
    id: "standard",
    label: "Standard Delivery",
    description: "Courier delivery across South Africa",
    baseFee: 95,
    minDays: 2,
    maxDays: 5,
    restricted: false,
  },
  {
    id: "express",
    label: "Express Delivery",
    description: "Next-business-day — major metros only",
    baseFee: 185,
    minDays: 1,
    maxDays: 2,
    restricted: true,
  },
  {
    id: "pickup",
    label: "Local Pickup",
    description: "Collect from our Cape Town studio, free — CBD & Atlantic Seaboard only",
    baseFee: 0,
    minDays: 1,
    maxDays: 2,
    restricted: true,
  },
];

/** Postal-code prefixes (first 2 digits) eligible for in-store pickup — the Cape Town CBD / Atlantic Seaboard area around the studio. */
export const PICKUP_POSTAL_PREFIXES = ["80", "79"];

export type DeliveryZoneId = "metro" | "regional" | "outlying";

/** Which delivery zone each province is treated as, for fee/ETA purposes. */
export const PROVINCE_ZONE: Record<SouthAfricanProvince, DeliveryZoneId> = {
  Gauteng: "metro",
  "Western Cape": "metro",
  "KwaZulu-Natal": "metro",
  "Eastern Cape": "regional",
  "Free State": "regional",
  Mpumalanga: "regional",
  "North West": "regional",
  Limpopo: "outlying",
  "Northern Cape": "outlying",
};

/** Fee/ETA multiplier applied to a method's base values per zone. */
export const ZONE_ADJUSTMENT: Record<DeliveryZoneId, { feeMultiplier: number; extraDays: number }> = {
  metro: { feeMultiplier: 0.85, extraDays: 0 },
  regional: { feeMultiplier: 1, extraDays: 1 },
  outlying: { feeMultiplier: 1.3, extraDays: 2 },
};
