import { describe, it, expect } from "vitest";
import { adminProductSchema } from "@/lib/validations/admin-products";

const valid = {
  sku: "SKU-001",
  name: "Solstice Coupe Glasses",
  shortDescription: "A pair of elegant coupe glasses.",
  description: "A full description of the coupe glasses set.",
  price: 1450,
  currency: "ZAR" as const,
  images: ["/images/coupe.jpg"],
  categorySlug: "glassware",
  productType: "Glassware",
  collectionSlugs: [],
  stockQuantity: 10,
  featured: false,
  tags: [],
  careInstructions: [],
};

describe("adminProductSchema (form validation)", () => {
  it("accepts a fully valid product payload", () => {
    expect(adminProductSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a negative price", () => {
    expect(adminProductSchema.safeParse({ ...valid, price: -10 }).success).toBe(false);
  });

  it("rejects a negative stock quantity", () => {
    expect(adminProductSchema.safeParse({ ...valid, stockQuantity: -1 }).success).toBe(false);
  });

  it("rejects a non-integer stock quantity", () => {
    expect(adminProductSchema.safeParse({ ...valid, stockQuantity: 1.5 }).success).toBe(false);
  });

  it("rejects an empty images array", () => {
    expect(adminProductSchema.safeParse({ ...valid, images: [] }).success).toBe(false);
  });

  it("rejects a slug with uppercase or invalid characters", () => {
    expect(adminProductSchema.safeParse({ ...valid, slug: "Not A Slug!" }).success).toBe(false);
  });

  it("accepts a well-formed slug", () => {
    expect(adminProductSchema.safeParse({ ...valid, slug: "solstice-coupe-glasses" }).success).toBe(true);
  });

  it("rejects a badge outside the fixed enum (prevents arbitrary label injection)", () => {
    expect(adminProductSchema.safeParse({ ...valid, badges: ["Not A Real Badge"] }).success).toBe(false);
  });

  it("rejects a missing SKU", () => {
    expect(adminProductSchema.safeParse({ ...valid, sku: "" }).success).toBe(false);
  });
});
