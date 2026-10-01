import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { siteConfig } from "@/config/site";

/** Merge Tailwind classes with proper conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  ZAR: "R",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

/**
 * Format a number as a price string in the site's currency (ZAR by
 * default), e.g. 1450 -> "R 1 450" — space-grouped thousands, no cents,
 * matching South African retail convention for this price band.
 *
 * Deliberately NOT built on `Intl.NumberFormat(locale, { style: "currency" })`:
 * Node's default (small-icu) build only ships full ICU data for English
 * locales, so `en-ZA` grouping can render differently server-side (Node)
 * than client-side (the browser, which always has full ICU) — a real
 * hydration mismatch. Grouping digits via the always-available `en-US`
 * locale and swapping the separator ourselves keeps output identical on
 * both sides regardless of the runtime's ICU data.
 */
export function formatPrice(amount: number, currency: string = siteConfig.currency) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const grouped = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
  return `${symbol} ${grouped.replace(/,/g, " ")}`;
}

/**
 * Format an ISO date string ("YYYY-MM-DD") as the DD.MM.YY style the real
 * KEEPS catalogue etches dates in (e.g. "12.09.26"). Parses the parts
 * directly rather than going through `Date`, so there's no UTC/local
 * timezone shift to worry about for a string that's purely decorative.
 */
export function formatEtchDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-");
  if (!year || !month || !day) return isoDate;
  return `${day}.${month}.${year.slice(-2)}`;
}

/** Joins the etched name/message/date into one display line, e.g. `SARAH — Private Reserve — 12.09.26`. Omits any part that's absent. */
export function formatPersonalizationLine(parts: {
  name?: string | null;
  message?: string | null;
  date?: string | null;
}) {
  return [parts.name, parts.message, parts.date ? formatEtchDate(parts.date) : null].filter(Boolean).join(" — ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
