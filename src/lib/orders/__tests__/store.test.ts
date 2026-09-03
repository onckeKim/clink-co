import { describe, it, expect, vi } from "vitest";
import { createOrder, findOrderByIdempotencyKey, getOrderByNumber } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";

// orders/store.ts reads the order-number prefix from the DB-backed (server-only)
// settings store — mocked here so this unit test can run in the test environment
// without a real Supabase connection.
vi.mock("@/lib/admin/settings-store", () => ({
  getStoreSettings: vi.fn().mockResolvedValue({ orderNumberPrefix: "CC" }),
}));

const testAddress = {
  fullName: "Ada Lovelace",
  line1: "1 Long Street",
  suburb: "City Bowl",
  city: "Cape Town",
  province: "Western Cape" as const,
  postalCode: "8001",
  phone: "0821234567",
};

function baseOrderInput(overrides: Partial<Omit<Order, "id" | "orderNumber" | "status" | "createdAt" | "updatedAt">> = {}) {
  return {
    idempotencyKey: crypto.randomUUID(),
    customerEmail: "shopper@example.com",
    customerName: "Ada Lovelace",
    isGuest: true,
    lines: [],
    deliveryAddress: testAddress,
    billingAddress: testAddress,
    deliveryMethodId: "standard",
    deliveryLabel: "Standard Delivery",
    estimatedDeliveryEarliest: new Date().toISOString(),
    estimatedDeliveryLatest: new Date().toISOString(),
    marketingConsent: false,
    subtotal: 0,
    discountAmount: 0,
    deliveryFee: 0,
    taxAmount: 0,
    total: 0,
    paymentMethod: "test",
    ...overrides,
  } as Omit<Order, "id" | "orderNumber" | "status" | "createdAt" | "updatedAt">;
}

describe("order number generation", () => {
  it("generates an order number in PREFIX-YYMMDD-NNNN format", async () => {
    const order = await createOrder(baseOrderInput());
    expect(order.orderNumber).toMatch(/^CC-\d{6}-\d{4}$/);
  });

  it("embeds today's date in the order number", async () => {
    const order = await createOrder(baseOrderInput());
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
    expect(order.orderNumber).toContain(`CC-${datePart}-`);
  });

  it("increments the daily sequence for successive orders", async () => {
    const first = await createOrder(baseOrderInput());
    const second = await createOrder(baseOrderInput());
    const firstSeq = Number(first.orderNumber.split("-")[2]);
    const secondSeq = Number(second.orderNumber.split("-")[2]);
    expect(secondSeq).toBe(firstSeq + 1);
  });

  it("zero-pads the sequence to 4 digits", async () => {
    const order = await createOrder(baseOrderInput());
    const seq = order.orderNumber.split("-")[2];
    expect(seq).toHaveLength(4);
  });

  it("produces a unique, retrievable order number every time", async () => {
    const order = await createOrder(baseOrderInput());
    expect(getOrderByNumber(order.orderNumber)?.id).toBe(order.id);
  });

  it("resets the daily counter when the date changes", async () => {
    const realDate = Date;
    class FixedDate extends realDate {
      constructor(...args: unknown[]) {
        // @ts-expect-error test shim
        if (args.length) super(...args);
        else super("2030-01-01T00:00:00.000Z");
      }
      static now() {
        return new realDate("2030-01-01T00:00:00.000Z").getTime();
      }
    }
    // @ts-expect-error swapping global Date for a fixed-date shim
    global.Date = FixedDate;
    try {
      const dayOneOrder = await createOrder(baseOrderInput());
      expect(dayOneOrder.orderNumber).toMatch(/^CC-300101-\d{4}$/);
    } finally {
      global.Date = realDate;
    }
  });
});

describe("createOrder idempotency", () => {
  it("returns the existing order instead of creating a duplicate for the same idempotency key", async () => {
    const key = crypto.randomUUID();
    const first = await createOrder(baseOrderInput({ idempotencyKey: key }));
    const second = await createOrder(baseOrderInput({ idempotencyKey: key }));
    expect(second.id).toBe(first.id);
    expect(second.orderNumber).toBe(first.orderNumber);
  });

  it("looks up an order by its idempotency key", async () => {
    const key = crypto.randomUUID();
    const order = await createOrder(baseOrderInput({ idempotencyKey: key }));
    expect(findOrderByIdempotencyKey(key)?.id).toBe(order.id);
  });

  it("returns undefined for an unknown idempotency key", () => {
    expect(findOrderByIdempotencyKey("never-used-key")).toBeUndefined();
  });
});
