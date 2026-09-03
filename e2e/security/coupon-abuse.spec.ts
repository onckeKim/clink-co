import { test, expect } from "../utils/fixtures";

const baseAddress = {
  fullName: "Att Acker",
  line1: "1 Test Street",
  suburb: "City Bowl",
  city: "Cape Town",
  province: "Western Cape",
  postalCode: "8001",
  phone: "0821234567",
};

function checkoutPayload(overrides: Record<string, unknown>) {
  return {
    idempotencyKey: `sec-coupon-${Date.now()}-${Math.random()}`,
    customer: { email: "attacker@example.com", firstName: "Att", lastName: "Acker", phone: "0821234567" },
    deliveryAddress: baseAddress,
    billingAddress: baseAddress,
    billingSameAsDelivery: true,
    deliveryMethodId: "standard",
    paymentMethod: "test",
    marketingConsent: false,
    termsAccepted: true,
    lines: [{ slug: "solstice-coupe-glasses", quantity: 1 }],
    ...overrides,
  };
}

test.describe("Invalid coupon abuse", () => {
  test("a nonexistent coupon code is rejected at checkout, not silently ignored", async ({ request }) => {
    const res = await request.post("/api/checkout", { data: checkoutPayload({ couponCode: "TOTALLY-FAKE-CODE" }) });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.field).toBe("couponCode");
  });

  test("a single-use coupon that has already reached its usage limit is rejected (ONEUSE seed coupon)", async ({ request }) => {
    const res = await request.post("/api/checkout", { data: checkoutPayload({ couponCode: "ONEUSE" }) });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/usage limit/i);
  });

  test("an expired coupon is rejected even when supplied directly to the API (SUMMER24 seed coupon)", async ({ request }) => {
    const res = await request.post("/api/checkout", { data: checkoutPayload({ couponCode: "SUMMER24" }) });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/expired/i);
  });

  test("a collection-scoped coupon is rejected when the cart has nothing from that collection (HOMEBAR15 → home-bar-edit)", async ({ request }) => {
    const res = await request.post("/api/checkout", { data: checkoutPayload({ couponCode: "HOMEBAR15" }) });
    expect(res.status()).toBe(409);
    const body = await res.json();
    expect(body.error).toMatch(/doesn't apply/i);
  });

  test("repeatedly applying the same expired/invalid coupon does not eventually succeed (no retry-based bypass)", async ({ request }) => {
    for (let i = 0; i < 3; i++) {
      const res = await request.post("/api/checkout", { data: checkoutPayload({ couponCode: "WINTER26" }) });
      expect(res.status()).toBe(409);
    }
  });
});
