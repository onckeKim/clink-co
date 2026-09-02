import { siteConfig } from "@/config/site";

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
