import { describe, it, expect } from "vitest";
import { validateCartLines } from "@/lib/cart-validation";

// Real seed product slugs (src/data/products-seed.ts):
// solstice-coupe-glasses: price 1450, stockQuantity 42, inStock true
// tidewater-ice-bucket:   stockQuantity 0, inStock false
// cove-copper-bar-tools:  stockQuantity 4, inStock true

describe("validateCartLines (inventory checks)", () => {
  it("passes through a valid, in-stock line unchanged (ok: true)", () => {
    const result = validateCartLines([{ slug: "solstice-coupe-glasses", quantity: 2 }]);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({ slug: "solstice-coupe-glasses", quantity: 2, unitPrice: 1450, lineTotal: 2900 });
  });

  it("flags a product that doesn't exist", () => {
    const result = validateCartLines([{ slug: "does-not-exist", quantity: 1 }]);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ type: "not-found", slug: "does-not-exist" });
    expect(result.lines).toHaveLength(0);
  });

  it("flags an out-of-stock product and does not add a line for it", () => {
    const result = validateCartLines([{ slug: "tidewater-ice-bucket", quantity: 1 }]);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ type: "out-of-stock", slug: "tidewater-ice-bucket" });
    expect(result.lines).toHaveLength(0);
  });

  it("flags insufficient stock but still returns a clamped line at the available quantity", () => {
    const result = validateCartLines([{ slug: "cove-copper-bar-tools", quantity: 10 }]);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ type: "insufficient-stock", availableStock: 4 });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].quantity).toBe(4); // clamped to available stock
  });

  it("does not flag a request exactly at the available stock quantity", () => {
    const result = validateCartLines([{ slug: "cove-copper-bar-tools", quantity: 4 }]);
    expect(result.ok).toBe(true);
    expect(result.lines[0].quantity).toBe(4);
  });

  it("processes multiple lines independently, mixing valid and invalid", () => {
    const result = validateCartLines([
      { slug: "solstice-coupe-glasses", quantity: 1 },
      { slug: "tidewater-ice-bucket", quantity: 1 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].slug).toBe("solstice-coupe-glasses");
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].slug).toBe("tidewater-ice-bucket");
  });

  it("recomputes unitPrice server-side rather than trusting any client-supplied price", () => {
    const result = validateCartLines([{ slug: "solstice-coupe-glasses", quantity: 1 }]);
    // CartLineInput has no `price` field at all — this proves the server is
    // the sole source of truth for price (see the price-manipulation security test).
    expect(result.lines[0].unitPrice).toBe(1450);
  });

  it("returns an empty result for an empty cart", () => {
    const result = validateCartLines([]);
    expect(result.ok).toBe(true);
    expect(result.lines).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
  });
});
