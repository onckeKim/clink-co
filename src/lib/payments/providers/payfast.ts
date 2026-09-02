import crypto from "node:crypto";
import type { PaymentProvider } from "../types";

/**
 * PayFast (payfast.co.za). Implemented from PayFast's public "Onsite &
 * Redirect" integration docs — NOT verified against a live merchant
 * account (none exists in this environment). Re-check field names, the
 * signature recipe and the process-endpoint submission method (PayFast's
 * documented flow is an HTML form POST; some integrations instead render
 * a tiny auto-submitting form page rather than a bare redirect — do that
 * if a plain redirect doesn't work) against payfast.co.za's current docs
 * before relying on this in production.
 *
 * Required env vars: PAYFAST_MERCHANT_ID, PAYFAST_MERCHANT_KEY.
 * Optional: PAYFAST_PASSPHRASE (strongly recommended — enables signature
 * verification on incoming webhooks), PAYFAST_SANDBOX=true for the sandbox
 * host during development.
 */

function isConfigured(): boolean {
  return Boolean(process.env.PAYFAST_MERCHANT_ID && process.env.PAYFAST_MERCHANT_KEY);
}

function processUrl(): string {
  return process.env.PAYFAST_SANDBOX === "true"
    ? "https://sandbox.payfast.co.za/eng/process"
    : "https://www.payfast.co.za/eng/process";
}

/** PayFast's signature: MD5 of the fields in insertion order, URL-encoded PayFast-style, with the passphrase appended if set. */
function sign(fields: Record<string, string>, passphrase?: string): string {
  let paramString = Object.entries(fields)
    .filter(([, value]) => value !== "")
    .map(([key, value]) => `${key}=${encodeURIComponent(value.trim()).replace(/%20/g, "+")}`)
    .join("&");
  if (passphrase) {
    paramString += `&passphrase=${encodeURIComponent(passphrase.trim()).replace(/%20/g, "+")}`;
  }
  return crypto.createHash("md5").update(paramString).digest("hex");
}

export const payfastProvider: PaymentProvider = {
  id: "payfast",
  label: "PayFast",
  description: "Cards, Instant EFT and more via PayFast.",
  isConfigured,

  async initiate({ orderNumber, amount, customerEmail, customerName, returnUrl, cancelUrl, notifyUrl }) {
    if (!isConfigured()) {
      throw new Error("PayFast is not configured — set PAYFAST_MERCHANT_ID and PAYFAST_MERCHANT_KEY.");
    }

    const [nameFirst, ...rest] = customerName.trim().split(" ");
    const fields: Record<string, string> = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID!,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY!,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      name_first: nameFirst || customerName,
      name_last: rest.join(" ") || "",
      email_address: customerEmail,
      m_payment_id: orderNumber,
      amount: amount.toFixed(2),
      item_name: `Clink & Co order ${orderNumber}`,
    };
    const signature = sign(fields, process.env.PAYFAST_PASSPHRASE);
    const query = new URLSearchParams({ ...fields, signature }).toString();

    return {
      redirectUrl: `${processUrl()}?${query}`,
      providerReference: `PF-${orderNumber}-${Date.now()}`,
    };
  },

  parseWebhook(rawBody) {
    const params = new URLSearchParams(rawBody);
    const receivedSignature = params.get("signature");
    if (!receivedSignature) return null;

    const fields: Record<string, string> = {};
    for (const [key, value] of params.entries()) {
      if (key !== "signature") fields[key] = value;
    }
    const expected = sign(fields, process.env.PAYFAST_PASSPHRASE);
    if (expected !== receivedSignature) return null;

    const paymentStatus = params.get("payment_status");
    const status = paymentStatus === "COMPLETE" ? "paid" : paymentStatus === "CANCELLED" ? "cancelled" : "failed";
    const pfPaymentId = params.get("pf_payment_id") ?? "";

    return {
      providerReference: pfPaymentId,
      orderNumber: params.get("m_payment_id") ?? undefined,
      status,
      eventId: `payfast:${pfPaymentId}`,
      raw: fields,
    };
  },
};
