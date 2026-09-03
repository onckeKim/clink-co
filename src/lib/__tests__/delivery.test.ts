import { describe, it, expect, afterEach } from "vitest";
import {
  isValidSAPostalCode,
  estimateDelivery,
  isPickupPostalCode,
  getAvailableDeliveryMethods,
  quoteDelivery,
} from "@/lib/delivery";
import { updateStoreSettings, getStoreSettings } from "@/lib/admin/settings-store";

const originalSettings = getStoreSettings();
afterEach(() => {
  updateStoreSettings(originalSettings);
});

describe("isValidSAPostalCode", () => {
  it("accepts a 4-digit code", () => {
    expect(isValidSAPostalCode("8001")).toBe(true);
  });

  it("rejects a code with letters", () => {
    expect(isValidSAPostalCode("80A1")).toBe(false);
  });

  it("rejects a code with the wrong length", () => {
    expect(isValidSAPostalCode("801")).toBe(false);
    expect(isValidSAPostalCode("80011")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidSAPostalCode("")).toBe(false);
  });

  it("tolerates surrounding whitespace", () => {
    expect(isValidSAPostalCode(" 8001 ")).toBe(true);
  });
});

describe("estimateDelivery (PDP quick estimate)", () => {
  it("rejects an invalid postal code", () => {
    const result = estimateDelivery("abc", 1000);
    expect(result.ok).toBe(false);
  });

  it("resolves a Cape Town CBD code to the metro zone", () => {
    const result = estimateDelivery("8001", 100);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.estimate.zoneLabel).toBe("Major metro");
  });

  it("resolves an unmapped code to the regional zone by default", () => {
    const result = estimateDelivery("5000", 100);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.estimate.zoneLabel).toBe("Regional town");
  });

  it("resolves a Northern Cape code to the outlying zone", () => {
    const result = estimateDelivery("8500", 100);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.estimate.zoneLabel).toBe("Outlying / rural area");
  });

  it("charges the zone fee when under the free-delivery threshold", () => {
    const result = estimateDelivery("8001", 100);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.estimate.fee).toBe(65);
      expect(result.estimate.freeDeliveryEligible).toBe(false);
    }
  });

  it("waives the fee once the order value meets the free-delivery threshold", () => {
    const threshold = getStoreSettings().freeDeliveryThreshold;
    const result = estimateDelivery("8001", threshold);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.estimate.fee).toBe(0);
      expect(result.estimate.freeDeliveryEligible).toBe(true);
    }
  });
});

describe("isPickupPostalCode", () => {
  it("accepts a Cape Town CBD prefix (80...)", () => {
    expect(isPickupPostalCode("8001")).toBe(true);
  });

  it("accepts an Atlantic Seaboard prefix (79...)", () => {
    expect(isPickupPostalCode("7945")).toBe(true);
  });

  it("rejects a Johannesburg prefix", () => {
    expect(isPickupPostalCode("2196")).toBe(false);
  });
});

describe("getAvailableDeliveryMethods", () => {
  it("offers standard delivery everywhere", () => {
    const methods = getAvailableDeliveryMethods("Limpopo", "0700");
    expect(methods.some((m) => m.id === "standard")).toBe(true);
  });

  it("only offers express delivery in metro provinces", () => {
    const metro = getAvailableDeliveryMethods("Gauteng", "2000");
    expect(metro.some((m) => m.id === "express")).toBe(true);

    const nonMetro = getAvailableDeliveryMethods("Limpopo", "0700");
    expect(nonMetro.some((m) => m.id === "express")).toBe(false);
  });

  it("only offers pickup within the pickup postal-code prefixes", () => {
    const inRange = getAvailableDeliveryMethods("Western Cape", "8001");
    expect(inRange.some((m) => m.id === "pickup")).toBe(true);

    const outOfRange = getAvailableDeliveryMethods("Western Cape", "7001");
    expect(outOfRange.some((m) => m.id === "pickup")).toBe(false);
  });

  it("excludes a method the admin has disabled in store settings", () => {
    updateStoreSettings({ enabledDeliveryMethodIds: ["standard"] });
    const methods = getAvailableDeliveryMethods("Gauteng", "2000");
    expect(methods.map((m) => m.id)).toEqual(["standard"]);
  });
});

describe("quoteDelivery (checkout-time quote)", () => {
  it("rejects an invalid postal code", () => {
    const result = quoteDelivery({
      methodId: "standard",
      province: "Gauteng",
      postalCode: "bad",
      orderValue: 500,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a method that isn't available for the address", () => {
    const result = quoteDelivery({
      methodId: "express",
      province: "Limpopo",
      postalCode: "0700",
      orderValue: 500,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/isn't available/i);
  });

  it("applies the metro fee multiplier and zero extra days", () => {
    const result = quoteDelivery({
      methodId: "standard",
      province: "Gauteng",
      postalCode: "2000",
      orderValue: 100,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      // standard baseFee 95 * metro multiplier 0.85 = 80.75 -> rounds to 81
      expect(result.quote.fee).toBe(81);
      expect(result.quote.minDays).toBe(2); // 2 + 0 extra days
    }
  });

  it("applies the outlying fee multiplier and extra days", () => {
    const result = quoteDelivery({
      methodId: "standard",
      province: "Northern Cape",
      postalCode: "8500",
      orderValue: 100,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      // standard baseFee 95 * outlying multiplier 1.3 = 123.5 -> rounds to 124 (banker's/JS round -> 124)
      expect(result.quote.fee).toBe(124);
      expect(result.quote.minDays).toBe(4); // 2 + 2 extra days
    }
  });

  it("pickup is always free regardless of order value", () => {
    const result = quoteDelivery({
      methodId: "pickup",
      province: "Western Cape",
      postalCode: "8001",
      orderValue: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.quote.fee).toBe(0);
  });

  it("waives the fee once order value meets the free-delivery threshold", () => {
    const threshold = getStoreSettings().freeDeliveryThreshold;
    const result = quoteDelivery({
      methodId: "standard",
      province: "Gauteng",
      postalCode: "2000",
      orderValue: threshold,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.quote.fee).toBe(0);
  });

  it("waives the fee when a coupon grants a free-delivery override, even under the threshold", () => {
    const result = quoteDelivery({
      methodId: "standard",
      province: "Gauteng",
      postalCode: "2000",
      orderValue: 1,
      freeDeliveryOverride: true,
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.quote.fee).toBe(0);
  });

  it("skips weekends when computing the earliest delivery date", () => {
    // A Friday quote for a 1-day method should land on Monday, not Saturday.
    const result = quoteDelivery({
      methodId: "pickup",
      province: "Western Cape",
      postalCode: "8001",
      orderValue: 1,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const earliest = new Date(result.quote.earliestDate);
      expect(earliest.getDay()).not.toBe(0); // not Sunday
      expect(earliest.getDay()).not.toBe(6); // not Saturday
    }
  });
});
