import crypto from "node:crypto";
import type { PaymentProvider } from "../types";

/**
 * Yoco Online Checkout API. Implemented from Yoco's public API docs — NOT
 * verified against a live account. Re-check the request/response shape
 * and the webhook signing scheme (Yoco uses a Svix-compatible
 * `webhook-id`/`webhook-timestamp`/`webhook-signature` header set — the
 * verification below follows that convention but should be checked
 * against Yoco's current docs) before production use.
 *
 * Required env var: YOCO_SECRET_KEY. Optional: YOCO_WEBHOOK_SECRET (a
 * `whsec_...` value) to verify webhook signatures.
 */

function isConfigured(): boolean {
  return Boolean(process.env.YOCO_SECRET_KEY);
}

export const yocoProvider: PaymentProvider = {
  id: "yoco",
  label: "Yoco",
  description: "Cards via Yoco.",
  isConfigured,

  async initiate({ orderNumber, amount, returnUrl, cancelUrl }) {
    if (!isConfigured()) {
      throw new Error("Yoco is not configured — set YOCO_SECRET_KEY.");
    }

    const response = await fetch("https://payments.yoco.com/api/checkouts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Auth-Secret-Key": process.env.YOCO_SECRET_KEY!,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Yoco amounts are in cents
        currency: "ZAR",
        successUrl: returnUrl,
        cancelUrl,
        failureUrl: cancelUrl,
        metadata: { orderNumber },
      }),
    });

    if (!response.ok) {
      throw new Error(`Yoco checkout creation failed: ${response.status} ${await response.text()}`);
    }

    const data = (await response.json()) as { id: string; redirectUrl: string };
    return { redirectUrl: data.redirectUrl, providerReference: data.id };
  },

  parseWebhook(rawBody, headers) {
    const secret = process.env.YOCO_WEBHOOK_SECRET;
    const webhookId = headers["webhook-id"];
    const timestamp = headers["webhook-timestamp"];
    const signatureHeader = headers["webhook-signature"];
    if (!secret || !webhookId || !timestamp || !signatureHeader) return null;

    const signedContent = `${webhookId}.${timestamp}.${rawBody}`;
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = crypto.createHmac("sha256", secretBytes).update(signedContent).digest("base64");

    const providedSignatures = signatureHeader.split(" ").map((part) => part.split(",")[1]).filter(Boolean);
    if (!providedSignatures.some((sig) => sig === expected)) return null;

    let payload: { type?: string; payload?: { id?: string; status?: string; metadata?: { orderNumber?: string } } };
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return null;
    }

    const rawStatus = (payload.payload?.status ?? payload.type ?? "").toLowerCase();
    const status = rawStatus.includes("succeeded")
      ? "paid"
      : rawStatus.includes("cancel")
        ? "cancelled"
        : rawStatus.includes("fail")
          ? "failed"
          : "pending";

    return {
      providerReference: payload.payload?.id ?? webhookId,
      orderNumber: payload.payload?.metadata?.orderNumber,
      status,
      eventId: `yoco:${webhookId}`,
      raw: payload,
    };
  },
};
