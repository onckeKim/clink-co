import crypto from "node:crypto";
import type { PaymentProvider } from "../types";

/**
 * Peach Payments Checkout API. Implemented from Peach's public docs — NOT
 * verified against a live account. Peach's flow creates a `checkoutId`
 * server-side, then expects the client to embed Peach's own
 * `paymentWidgets.js` (loaded with that checkoutId) to collect card
 * details in an iframe — it isn't a plain hosted-page redirect like
 * PayFast/Ozow. The redirect URL below points at an in-app page that
 * would load that widget; building the actual widget page is a follow-up
 * task once real Peach credentials exist to test against. Re-check the
 * request shape, host, and webhook signing scheme against Peach's current
 * docs before production use.
 *
 * Required env vars: PEACH_ENTITY_ID, PEACH_ACCESS_TOKEN. Optional:
 * PEACH_API_BASE_URL (defaults to the test host), PEACH_WEBHOOK_SECRET.
 */

function isConfigured(): boolean {
  return Boolean(process.env.PEACH_ENTITY_ID && process.env.PEACH_ACCESS_TOKEN);
}

function apiBase(): string {
  return process.env.PEACH_API_BASE_URL ?? "https://eu-test.oppwa.com";
}

export const peachProvider: PaymentProvider = {
  id: "peach",
  label: "Peach Payments",
  description: "Cards and local payment methods via Peach Payments.",
  isConfigured,

  async initiate({ orderNumber, amount, returnUrl }) {
    if (!isConfigured()) {
      throw new Error("Peach Payments is not configured — set PEACH_ENTITY_ID and PEACH_ACCESS_TOKEN.");
    }

    const body = new URLSearchParams({
      entityId: process.env.PEACH_ENTITY_ID!,
      amount: amount.toFixed(2),
      currency: "ZAR",
      paymentType: "DB",
      merchantTransactionId: orderNumber,
      "customParameters[return_url]": returnUrl,
    });

    const response = await fetch(`${apiBase()}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${process.env.PEACH_ACCESS_TOKEN}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Peach checkout creation failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { id: string };
    return {
      redirectUrl: `/checkout/pay/peach/${data.id}?orderNumber=${encodeURIComponent(orderNumber)}`,
      providerReference: data.id,
    };
  },

  parseWebhook(rawBody, headers) {
    const secret = process.env.PEACH_WEBHOOK_SECRET;
    const signature = headers["x-signature"];
    if (!secret || !signature) return null;

    const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    if (expected !== signature) return null;

    let payload: { id?: string; merchantTransactionId?: string; result?: { code?: string } };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const code = payload.result?.code ?? "";
    // Peach's result.code is a dotted status code — 000.000.* / 000.100.1* mean successful.
    const status = /^(000\.000\.|000\.100\.1)/.test(code) ? "paid" : /cancel/i.test(code) ? "cancelled" : "failed";

    return {
      providerReference: payload.id ?? "",
      orderNumber: payload.merchantTransactionId,
      status,
      eventId: `peach:${payload.id}`,
      raw: payload,
    };
  },
};
