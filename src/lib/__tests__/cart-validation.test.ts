import { describe, it, expect, vi } from "vitest";
import { validateCartLines } from "@/lib/cart-validation";
import type { Product } from "@/types/product";

// Fixture products mirroring a few real src/data/products-seed.ts entries —
// validateCartLines() now reads through @/data/products (DB-backed), so
// products-store.ts is mocked here rather than relying on real seed data.
function makeProduct(overrides: Partial<Product>): Product {
  return {
    id: `prod-${overrides.slug}`,
    slug: overrides.slug!,
    sku: overrides.sku ?? "SKU-TEST",
    name: overrides.name ?? "Test Product",
    shortDescription: "",
    description: "",
    price: 0,
    currency: "ZAR",
    images: ["/images/test.svg"],
    categorySlug: "glassware",
    productType: "Test Type",
    collectionSlugs: [],
    stockQuantity: 0,
    inStock: false,
    featured: false,
    tags: [],
    careInstructions: [],
    ...overrides,
  };
}

const fixtureProducts: Product[] = [
  makeProduct({ slug: "solstice-coupe-glasses", sku: "CC-GLS-001", name: "Solstice Coupe Glasses", price: 1450, stockQuantity: 42, inStock: true }),
  makeProduct({ slug: "tidewater-ice-bucket", sku: "CC-SRV-002", name: "Tidewater Ice Bucket", price: 1980, stockQuantity: 0, inStock: false }),
  makeProduct({ slug: "cove-copper-bar-tools", sku: "CC-BAR-003", name: "Cove Copper Bar Tools Set", price: 1620, stockQuantity: 4, inStock: true }),
];

vi.mock("@/lib/admin/products-store", () => ({
  getProducts: async () => fixtureProducts,
}));

describe("validateCartLines (inventory checks)", () => {
  it("passes through a valid, in-stock line unchanged (ok: true)", async () => {
    const result = await validateCartLines([{ slug: "solstice-coupe-glasses", quantity: 2 }]);
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]).toMatchObject({ slug: "solstice-coupe-glasses", quantity: 2, unitPrice: 1450, lineTotal: 2900 });
  });

  it("flags a product that doesn't exist", async () => {
    const result = await validateCartLines([{ slug: "does-not-exist", quantity: 1 }]);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ type: "not-found", slug: "does-not-exist" });
    expect(result.lines).toHaveLength(0);
  });

  it("flags an out-of-stock product and does not add a line for it", async () => {
    const result = await validateCartLines([{ slug: "tidewater-ice-bucket", quantity: 1 }]);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ type: "out-of-stock", slug: "tidewater-ice-bucket" });
    expect(result.lines).toHaveLength(0);
  });

  it("flags insufficient stock but still returns a clamped line at the available quantity", async () => {
    const result = await validateCartLines([{ slug: "cove-copper-bar-tools", quantity: 10 }]);
    expect(result.ok).toBe(false);
    expect(result.issues[0]).toMatchObject({ type: "insufficient-stock", availableStock: 4 });
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].quantity).toBe(4); // clamped to available stock
  });

  it("does not flag a request exactly at the available stock quantity", async () => {
    const result = await validateCartLines([{ slug: "cove-copper-bar-tools", quantity: 4 }]);
    expect(result.ok).toBe(true);
    expect(result.lines[0].quantity).toBe(4);
  });

  it("processes multiple lines independently, mixing valid and invalid", async () => {
    const result = await validateCartLines([
      { slug: "solstice-coupe-glasses", quantity: 1 },
      { slug: "tidewater-ice-bucket", quantity: 1 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].slug).toBe("solstice-coupe-glasses");
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].slug).toBe("tidewater-ice-bucket");
  });

  it("recomputes unitPrice server-side rather than trusting any client-supplied price", async () => {
    const result = await validateCartLines([{ slug: "solstice-coupe-glasses", quantity: 1 }]);
    // CartLineInput has no `price` field at all — this proves the server is
    // the sole source of truth for price (see the price-manipulation security test).
    expect(result.lines[0].unitPrice).toBe(1450);
  });

  it("returns an empty result for an empty cart", async () => {
    const result = await validateCartLines([]);
    expect(result.ok).toBe(true);
    expect(result.lines).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
  });
});
