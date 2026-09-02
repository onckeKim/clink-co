import { siteConfig } from "@/config/site";
import {
  deliveryMethods,
  PICKUP_POSTAL_PREFIXES,
  PROVINCE_ZONE,
  ZONE_ADJUSTMENT,
  type DeliveryMethodConfig,
  type DeliveryMethodId,
} from "@/config/delivery";
import type { SouthAfricanProvince } from "@/data/provinces";

/**
 * A lightweight, illustrative South African delivery estimator. Real courier
 * quoting needs an actual rate-card/geocoding integration (run at checkout,
 * per the disclaimer this powers) — this gives a shopper a reasonable
 * expectation on the PDP without that integration existing yet. Zones are
 * grouped by well-known metro postal-code ranges; everything else falls
 * back to a regional or outlying estimate.
 */

type DeliveryZoneId = "metro" | "regional" | "outlying";

interface DeliveryZoneDetails {
  id: DeliveryZoneId;
  label: string;
  minDays: number;
  maxDays: number;
  fee: number;
}

const ZONES: Record<DeliveryZoneId, DeliveryZoneDetails> = {
  metro: { id: "metro", label: "Major metro", minDays: 1, maxDays: 2, fee: 65 },
  regional: { id: "regional", label: "Regional town", minDays: 2, maxDays: 4, fee: 95 },
  outlying: { id: "outlying", label: "Outlying / rural area", minDays: 4, maxDays: 7, fee: 145 },
};

/** Postal-code ranges for South Africa's major metros — approximate, for illustration only. */
const METRO_RANGES: [number, number][] = [
  [1, 299], // Pretoria / Tshwane
  [1400, 2199], // Johannesburg, East Rand, Sandton
  [3600, 3699], // Pietermaritzburg
  [4000, 4099], // Durban
  [6000, 6099], // Port Elizabeth / Gqeberha
  [7100, 8001], // Cape Town
];

/** Postal-code ranges more likely to be far from a metro distribution hub — approximate, for illustration only. */
const OUTLYING_RANGES: [number, number][] = [
  [8200, 8999], // Northern Cape
  [9300, 9999], // Free State interior / far south
  [900, 999], // Limpopo far north
];

function inRanges(code: number, ranges: [number, number][]): boolean {
  return ranges.some(([min, max]) => code >= min && code <= max);
}

function resolveZone(code: number): DeliveryZoneDetails {
  if (inRanges(code, METRO_RANGES)) return ZONES.metro;
  if (inRanges(code, OUTLYING_RANGES)) return ZONES.outlying;
  return ZONES.regional;
}

export interface DeliveryEstimate {
  postalCode: string;
  zoneLabel: string;
  minDays: number;
  maxDays: number;
  fee: number;
  freeDeliveryEligible: boolean;
  freeDeliveryThreshold: number;
}

export type DeliveryEstimateResult =
  | { ok: true; estimate: DeliveryEstimate }
  | { ok: false; error: string };

/** South African postal codes are 4 digits, 0000–9999. */
export function isValidSAPostalCode(postalCode: string): boolean {
  return /^\d{4}$/.test(postalCode.trim());
}

export function estimateDelivery(postalCode: string, orderValue: number): DeliveryEstimateResult {
  const trimmed = postalCode.trim();
  if (!isValidSAPostalCode(trimmed)) {
    return { ok: false, error: "Enter a valid 4-digit South African postal code." };
  }

  const code = Number(trimmed);
  const zone = resolveZone(code);
  const freeDeliveryEligible = orderValue >= siteConfig.freeDeliveryThreshold;

  return {
    ok: true,
    estimate: {
      postalCode: trimmed,
      zoneLabel: zone.label,
      minDays: zone.minDays,
      maxDays: zone.maxDays,
      fee: freeDeliveryEligible ? 0 : zone.fee,
      freeDeliveryEligible,
      freeDeliveryThreshold: siteConfig.freeDeliveryThreshold,
    },
  };
}

// ---------------------------------------------------------------------------
// Checkout-time delivery quoting — method + province + postal code aware.
// The PDP estimator above stays postal-code-only (a quick "will this ship
// fast" gut check before a method is chosen); this is the fuller quote used
// once a delivery address and method are on the table at checkout.
// ---------------------------------------------------------------------------

export function isPickupPostalCode(postalCode: string): boolean {
  return PICKUP_POSTAL_PREFIXES.some((prefix) => postalCode.startsWith(prefix));
}

/** Which of the configured delivery methods can actually be offered for this address. */
export function getAvailableDeliveryMethods(
  province: SouthAfricanProvince,
  postalCode: string,
): DeliveryMethodConfig[] {
  const zone = PROVINCE_ZONE[province];
  return deliveryMethods.filter((method) => {
    if (method.id === "express") return zone === "metro";
    if (method.id === "pickup") return isPickupPostalCode(postalCode);
    return true;
  });
}

function addBusinessDays(from: Date, days: number): Date {
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const day = result.getDay();
    if (day !== 0 && day !== 6) added += 1;
  }
  return result;
}

export interface DeliveryQuote {
  methodId: DeliveryMethodId;
  label: string;
  fee: number;
  minDays: number;
  maxDays: number;
  /** ISO date strings — the earliest/latest calendar date the order is expected to arrive, skipping weekends. */
  earliestDate: string;
  latestDate: string;
  freeDeliveryApplied: boolean;
}

export type DeliveryQuoteResult = { ok: true; quote: DeliveryQuote } | { ok: false; error: string };

export function quoteDelivery({
  methodId,
  province,
  postalCode,
  orderValue,
  freeDeliveryOverride = false,
}: {
  methodId: DeliveryMethodId;
  province: SouthAfricanProvince;
  postalCode: string;
  /** Cart subtotal after discounts — used for the free-delivery threshold. */
  orderValue: number;
  /** True when an applied coupon grants free delivery regardless of threshold. */
  freeDeliveryOverride?: boolean;
}): DeliveryQuoteResult {
  if (!isValidSAPostalCode(postalCode)) {
    return { ok: false, error: "Enter a valid 4-digit postal code." };
  }

  const method = deliveryMethods.find((m) => m.id === methodId);
  if (!method) return { ok: false, error: "Select a delivery method." };

  const available = getAvailableDeliveryMethods(province, postalCode);
  if (!available.some((m) => m.id === methodId)) {
    return { ok: false, error: `${method.label} isn't available for this address.` };
  }

  const zone = PROVINCE_ZONE[province];
  const adjustment = ZONE_ADJUSTMENT[zone];
  const freeDeliveryApplied =
    method.id === "pickup" || freeDeliveryOverride || orderValue >= siteConfig.freeDeliveryThreshold;

  const fee = freeDeliveryApplied ? 0 : Math.round(method.baseFee * adjustment.feeMultiplier);
  const minDays = method.minDays + adjustment.extraDays;
  const maxDays = method.maxDays + adjustment.extraDays;
  const now = new Date();

  return {
    ok: true,
    quote: {
      methodId: method.id,
      label: method.label,
      fee,
      minDays,
      maxDays,
      earliestDate: addBusinessDays(now, minDays).toISOString(),
      latestDate: addBusinessDays(now, maxDays).toISOString(),
      freeDeliveryApplied,
    },
  };
}
