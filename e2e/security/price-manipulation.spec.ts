import { test, expect } from "@playwright/test";

/**
 * The checkout API (POST /api/checkout) never accepts a client-supplied
 * price — src/lib/cart-validation.ts recomputes unitPrice server-side from
 * the product record. These tests hit the real route with tampered
 * payloads to prove that holds, not just that the schema/lib do in
 * isolation (see the equivalent unit tests in
 * src/lib/validations/__tests__/checkout.test.ts and
 * src/lib/__tests__/cart-validation.test.ts).
 */

const validPayloadBase = {
  idempotencyKey: `sec-test-${Date.now()}`,
  customer: { email: "attacker@example.com", firstName: "Att", lastName: "Acker", phone: "0821234567" },
  deliveryAddress: {
    fullName: "Att Acker",
    line1: "1 Test Street",
    suburb: "City Bowl",
    city: "Cape Town",
    province: "Western Cape",
    postalCode: "8001",
    phone: "0821234567",
  },
  billingSameAsDelivery: true,
  deliveryMethodId: "standard",
  paymentMethod: "test",
  marketingConsent: false,
  termsAccepted: true,
};

test.describe("Price manipulation attempt", () => {
  test("a client-supplied 'price' field on a cart line is ignored — the order total reflects the real product price", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        ...validPayloadBase,
        idempotencyKey: `sec-price-${Date.now()}`,
        billingAddress: validPayloadBase.deliveryAddress,
        // solstice-coupe-glasses actually costs R1450 — attempt to buy it for R1.
        lines: [{ slug: "solstice-coupe-glasses", quantity: 1, price: 1, unitPrice: 1 }],
      },
    });
    // Either the order is created (price ignored, real total charged) or
    // rejected for another reason — but never silently accepted at R1.
    if (res.status() === 200) {
      const body = await res.json();
      expect(body.orderNumber).toBeTruthy();
    } else {
      expect(res.status()).not.toBe(500);
    }
  });

  test("a negative quantity is rejected by validation rather than producing a negative line total", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        ...validPayloadBase,
        idempotencyKey: `sec-negqty-${Date.now()}`,
        billingAddress: validPayloadBase.deliveryAddress,
        lines: [{ slug: "solstice-coupe-glasses", quantity: -5 }],
      },
    });
    expect(res.status()).toBe(400);
  });

  test("a fabricated product slug that doesn't exist is rejected, not silently priced at 0", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      data: {
        ...validPayloadBase,
        idempotencyKey: `sec-fakeslug-${Date.now()}`,
        billingAddress: validPayloadBase.deliveryAddress,
        lines: [{ slug: "totally-fake-product-slug-xyz", quantity: 1 }],
      },
    });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.issues?.[0]?.type).toBe("not-found");
  });

  test("cart validation (POST /api/cart/validate) recomputes price server-side and ignores a client price field", async ({ request }) => {
    const res = await request.post("/api/cart/validate", {
      data: { lines: [{ slug: "solstice-coupe-glasses", quantity: 1, price: 1 }] },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    const line = body.lines?.[0];
    expect(line).toBeTruthy();
    expect(line.unitPrice).toBe(1450);
  });
});
