import type { PaymentProvider } from "../types";

/**
 * A fully-working test payment provider — no external account needed. It
 * redirects to an in-app mock gateway page (/checkout/pay/[orderNumber])
 * where a developer/tester can simulate a successful, failed, cancelled or
 * pending outcome, which then posts a webhook-shaped payload back to
 * /api/webhooks/payments/test exactly like a real gateway would call your
 * notify URL. This is what exercises the full order → pay → webhook →
 * confirmation loop end-to-end today.
 *
 * Gated out of production by default — see isConfigured() — so it can
 * never appear as a real payment option to a paying customer. Set
 * ENABLE_TEST_PAYMENTS=true to force it on (e.g. for a staging demo).
 */

const WEBHOOK_SECRET = process.env.TEST_PAYMENT_WEBHOOK_SECRET ?? "test-secret";

export const testProvider: PaymentProvider = {
  id: "test",
  label: "Test Payment (simulator)",
  description: "Simulates a payment gateway — for development and demos only.",

  isConfigured() {
    return process.env.NODE_ENV !== "production" || process.env.ENABLE_TEST_PAYMENTS === "true";
  },

  async initiate({ orderNumber }) {
    const reference = `TEST-${crypto.randomUUID()}`;
    return {
      redirectUrl: `/checkout/pay/${orderNumber}?ref=${encodeURIComponent(reference)}`,
      providerReference: reference,
    };
  },

  parseWebhook(rawBody, headers) {
    if (headers["x-test-signature"] !== WEBHOOK_SECRET) return null;

    let payload: { orderNumber?: string; reference?: string; status?: string };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }
    if (!payload.reference || !payload.status) return null;

    const status =
      payload.status === "paid" || payload.status === "failed" || payload.status === "cancelled"
        ? payload.status
        : "pending";

    return {
      providerReference: payload.reference,
      orderNumber: payload.orderNumber,
      status,
      eventId: `test:${payload.reference}:${status}`,
      raw: payload,
    };
  },
};
