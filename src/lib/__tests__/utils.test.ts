import { describe, it, expect } from "vitest";
import { cn, formatPrice, slugify } from "@/lib/utils";

// formatPrice separates the symbol from the number, and groups thousands,
// with U+00A0 (non-breaking space) throughout — deliberate, so a formatted
// price never wraps across lines — not a regular space (U+0020).
const SP = " ";

describe("formatPrice (currency formatting)", () => {
  it("formats a whole-Rand amount with the ZAR symbol and space-grouped thousands", () => {
    expect(formatPrice(1450)).toBe(`R${SP}1${SP}450`);
  });

  it("formats amounts under 1000 without a grouping separator", () => {
    expect(formatPrice(580)).toBe(`R${SP}580`);
  });

  it("formats zero", () => {
    expect(formatPrice(0)).toBe(`R${SP}0`);
  });

  it("rounds fractional amounts to the nearest Rand (no cents shown)", () => {
    expect(formatPrice(1449.5)).toBe(`R${SP}1${SP}450`);
    expect(formatPrice(1449.4)).toBe(`R${SP}1${SP}449`);
  });

  it("groups large amounts at every thousand", () => {
    expect(formatPrice(1234567)).toBe(`R${SP}1${SP}234${SP}567`);
  });

  it("formats negative amounts (e.g. a refund line)", () => {
    expect(formatPrice(-100)).toBe(`R${SP}-100`);
  });

  it("supports an explicit currency override", () => {
    expect(formatPrice(1450, "USD")).toBe(`$${SP}1${SP}450`);
    expect(formatPrice(1450, "EUR")).toBe(`€${SP}1${SP}450`);
    expect(formatPrice(1450, "GBP")).toBe(`£${SP}1${SP}450`);
  });

  it("falls back to the raw currency code for an unknown currency", () => {
    expect(formatPrice(100, "XYZ")).toBe(`XYZ${SP}100`);
  });

  it("defaults to the site's ZAR currency when none is given", () => {
    expect(formatPrice(500)).toBe(`R${SP}500`);
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates spaces", () => {
    expect(slugify("Solstice Coupe Glasses")).toBe("solstice-coupe-glasses");
  });

  it("strips non-alphanumeric characters", () => {
    expect(slugify("Café & Bar, Set of 2!")).toBe("caf-bar-set-of-2");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Hello World--  ")).toBe("hello-world");
  });

  it("collapses repeated separators into a single hyphen", () => {
    expect(slugify("a   b---c")).toBe("a-b-c");
  });

  it("returns an empty string for empty input", () => {
    expect(slugify("")).toBe("");
  });
});

describe("cn (className merge)", () => {
  it("merges class names and resolves Tailwind conflicts (last wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("drops falsy values", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("supports conditional object syntax", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
