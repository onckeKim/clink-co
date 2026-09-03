import { test, expect } from "../utils/fixtures";
import {
  addFirstProductAndGoToCheckout,
  fillCustomerDetails,
  fillDeliveryAddress,
  pickDeliveryMethod,
  continueBilling,
  pickTestPaymentMethod,
  placeOrder,
} from "../utils/checkout-helpers";

/**
 * Every payment provider retries webhook delivery on anything but a 200,
 * so POST /api/webhooks/payments/[provider] must be idempotent per
 * eventId — a redelivered "paid" notification must not double-send the
 * payment-received email or otherwise double-process the order. See
 * src/app/api/webhooks/payments/[provider]/route.ts's `hasProcessedWebhookEvent`.
 */
test.describe("Duplicate payment webhook", () => {
  test("an unsigned/unverifiable webhook payload is rejected outright", async ({ request }) => {
    const res = await request.post("/api/webhooks/payments/test", {
      data: { reference: "TEST-forged", status: "paid" },
      headers: { "content-type": "application/json" }, // deliberately no x-test-signature
    });
    expect(res.status()).toBe(400);
  });

  test("an unknown payment provider name is rejected", async ({ request }) => {
    const res = await request.post("/api/webhooks/payments/not-a-real-provider", {
      data: { reference: "x", status: "paid" },
    });
    expect(res.status()).toBe(404);
  });

  test("redelivering the exact same webhook event twice is a no-op the second time", async ({ page, request }) => {
    await addFirstProductAndGoToCheckout(page);
    await fillCustomerDetails(page);
    await fillDeliveryAddress(page);
    await pickDeliveryMethod(page);
    await continueBilling(page);
    await pickTestPaymentMethod(page);
    await placeOrder(page);

    await expect(page).toHaveURL(/\/checkout\/pay\//);
    const url = new URL(page.url());
    const orderNumber = url.pathname.split("/").pop()!;
    const reference = url.searchParams.get("ref")!;

    const webhookBody = { orderNumber, reference, status: "paid" };
    const first = await request.post("/api/webhooks/payments/test", {
      data: webhookBody,
      headers: { "x-test-signature": "test-secret" },
    });
    expect(first.status()).toBe(200);
    const firstBody = await first.json();
    expect(firstBody.alreadyProcessed).toBeFalsy();

    const second = await request.post("/api/webhooks/payments/test", {
      data: webhookBody,
      headers: { "x-test-signature": "test-secret" },
    });
    expect(second.status()).toBe(200);
    const secondBody = await second.json();
    expect(secondBody.alreadyProcessed).toBe(true);

    const statusRes = await request.get(`/api/payments/${orderNumber}/status`);
    const statusBody = await statusRes.json();
    expect(statusBody.status).toBe("paid");
  });
});
