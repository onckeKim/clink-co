import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore } from "@/store/cart-store";
import { couponsSeed } from "@/data/coupons-seed";
import type { Product } from "@/types/product";

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    slug: "solstice-coupe-glasses",
    sku: "CC-GLS-SOL-04",
    name: "Solstice Coupe Glasses",
    shortDescription: "Elegant coupe glasses.",
    description: "Full description.",
    price: 1450,
    currency: "ZAR",
    images: ["/images/coupe.jpg"],
    categorySlug: "glassware",
    productType: "Coupe Glasses",
    collectionSlugs: [],
    stockQuantity: 5,
    inStock: true,
    ...overrides,
  } as Product;
}

beforeEach(() => {
  useCartStore.setState({
    lines: [],
    isOpen: false,
    coupon: null,
    manualCouponCode: null,
    couponError: null,
    // Normally seeded by <CouponsSync> from a server fetch — set directly here since these tests exercise the store in isolation.
    coupons: couponsSeed,
  });
});

describe("cart quantity validation (useCartStore)", () => {
  it("adds a new line with the requested quantity", () => {
    useCartStore.getState().addItem(makeProduct(), { quantity: 2 });
    const lines = useCartStore.getState().lines;
    expect(lines).toHaveLength(1);
    expect(lines[0].quantity).toBe(2);
  });

  it("defaults to a quantity of 1 when none is specified", () => {
    useCartStore.getState().addItem(makeProduct());
    expect(useCartStore.getState().lines[0].quantity).toBe(1);
  });

  it("caps the added quantity at the product's stock on hand", () => {
    useCartStore.getState().addItem(makeProduct({ stockQuantity: 3 }), { quantity: 10 });
    expect(useCartStore.getState().lines[0].quantity).toBe(3);
  });

  it("merges a repeat add-to-cart into the existing line, summing quantities (capped at stock)", () => {
    const product = makeProduct({ stockQuantity: 5 });
    useCartStore.getState().addItem(product, { quantity: 2 });
    useCartStore.getState().addItem(product, { quantity: 2 });
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].quantity).toBe(4);
  });

  it("caps a merged add at the stock ceiling rather than overselling", () => {
    const product = makeProduct({ stockQuantity: 5 });
    useCartStore.getState().addItem(product, { quantity: 3 });
    useCartStore.getState().addItem(product, { quantity: 3 });
    expect(useCartStore.getState().lines[0].quantity).toBe(5);
  });

  it("treats different variants of the same product as separate lines", () => {
    const product = makeProduct();
    useCartStore.getState().addItem(product, { variant: { id: "v1", label: "Smoke" } as never, quantity: 1 });
    useCartStore.getState().addItem(product, { variant: { id: "v2", label: "Ivory" } as never, quantity: 1 });
    expect(useCartStore.getState().lines).toHaveLength(2);
  });

  it("updateQuantity clamps a requested quantity to the given stock ceiling", () => {
    useCartStore.getState().addItem(makeProduct({ stockQuantity: 10 }), { quantity: 2 });
    const lineId = useCartStore.getState().lines[0].lineId;
    useCartStore.getState().updateQuantity(lineId, 20, 10);
    expect(useCartStore.getState().lines[0].quantity).toBe(10);
  });

  it("updateQuantity removes the line entirely when set to zero", () => {
    useCartStore.getState().addItem(makeProduct(), { quantity: 2 });
    const lineId = useCartStore.getState().lines[0].lineId;
    useCartStore.getState().updateQuantity(lineId, 0);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it("updateQuantity removes the line for a negative quantity", () => {
    useCartStore.getState().addItem(makeProduct(), { quantity: 2 });
    const lineId = useCartStore.getState().lines[0].lineId;
    useCartStore.getState().updateQuantity(lineId, -1);
    expect(useCartStore.getState().lines).toHaveLength(0);
  });

  it("removeLine removes only the targeted line", () => {
    useCartStore.getState().addItem(makeProduct({ id: "p1", slug: "p1" }), { quantity: 1 });
    useCartStore.getState().addItem(makeProduct({ id: "p2", slug: "p2" }), { quantity: 1 });
    const [first] = useCartStore.getState().lines;
    useCartStore.getState().removeLine(first.lineId);
    expect(useCartStore.getState().lines).toHaveLength(1);
    expect(useCartStore.getState().lines[0].productId).toBe("p2");
  });

  it("clear() empties the cart and any applied coupon", () => {
    useCartStore.getState().addItem(makeProduct(), { quantity: 1 });
    useCartStore.getState().clear();
    const state = useCartStore.getState();
    expect(state.lines).toHaveLength(0);
    expect(state.coupon).toBeNull();
  });

  it("auto-applies the best eligible automatic discount after a cart change", () => {
    // FREESHIP: requiresCode:false, minSpend 500, on a 1450 line total this is eligible
    useCartStore.getState().addItem(makeProduct({ price: 1450 }), { quantity: 1 });
    expect(useCartStore.getState().coupon?.code).toBe("FREESHIP");
    expect(useCartStore.getState().coupon?.source).toBe("automatic");
  });

  it("applyCoupon sets a couponError for an invalid code without mutating the cart", () => {
    useCartStore.getState().addItem(makeProduct({ price: 1450 }), { quantity: 1 });
    useCartStore.getState().applyCoupon("NOT-REAL");
    expect(useCartStore.getState().couponError).toBeTruthy();
    expect(useCartStore.getState().lines).toHaveLength(1);
  });

  it("open/close/toggle control isOpen", () => {
    useCartStore.getState().open();
    expect(useCartStore.getState().isOpen).toBe(true);
    useCartStore.getState().close();
    expect(useCartStore.getState().isOpen).toBe(false);
    useCartStore.getState().toggle();
    expect(useCartStore.getState().isOpen).toBe(true);
  });
});
