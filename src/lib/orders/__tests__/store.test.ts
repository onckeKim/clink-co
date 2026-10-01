import { describe, it, expect, vi } from "vitest";
import { createOrder, findOrderByIdempotencyKey, getOrderByNumber } from "@/lib/orders/store";
import type { Order } from "@/lib/orders/types";

// The "server-only" package works by resolving to a no-op under the
// "react-server" export condition (which only Next.js's own build applies)
// and to a module that unconditionally throws everywhere else — including
// under Vite/Vitest, which doesn't apply that condition. Every module in
// this file's import chain (orders/store.ts, and db/settings.ts/settings-store.ts
// via the mocked settings store below) carries that import for real
// production safety, so it's mocked out here rather than removed there.
vi.mock("server-only", () => ({}));

// orders/store.ts reads the order-number prefix from the DB-backed (server-only)
// settings store, and every order read/write from the DB-backed (server-only)
// orders DAL — both mocked here so this unit test can run without a real
// Supabase connection. The orders mock is a small in-memory fake that
// mirrors the real table's two guarantees this test suite actually cares
// about: a unique idempotency_key returns the same row instead of creating
// a second one, and order_number round-trips through a lookup.
vi.mock("@/lib/admin/settings-store", () => ({
  getStoreSettings: vi.fn().mockResolvedValue({ orderNumberPrefix: "CC" }),
}));

vi.mock("@/lib/db/orders", () => {
  const ordersByNumber = new Map<string, Record<string, unknown>>();
  const ordersByIdempotencyKey = new Map<string, Record<string, unknown>>();

  function withItems(row: Record<string, unknown>) {
    return { ...row, items: [] };
  }

  return {
    createOrderServerSide: vi.fn(async (order: Record<string, unknown>) => {
      const existing = ordersByIdempotencyKey.get(order.idempotency_key as string);
      if (existing) return withItems(existing);

      const row: Record<string, unknown> = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...order,
      };
      ordersByNumber.set(row.order_number as string, row);
      ordersByIdempotencyKey.set(row.idempotency_key as string, row);
      return withItems(row);
    }),
    getOrderByNumber: vi.fn(async (orderNumber: string) => {
      const row = ordersByNumber.get(orderNumber);
      return row ? withItems(row) : null;
    }),
    getOrderByIdempotencyKey: vi.fn(async (key: string) => {
      const row = ordersByIdempotencyKey.get(key);
      return row ? withItems(row) : null;
    }),
  };
});

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
    expect((await getOrderByNumber(order.orderNumber))?.id).toBe(order.id);
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
    expect((await findOrderByIdempotencyKey(key))?.id).toBe(order.id);
  });

  it("returns undefined for an unknown idempotency key", async () => {
    expect(await findOrderByIdempotencyKey("never-used-key")).toBeUndefined();
  });
});
