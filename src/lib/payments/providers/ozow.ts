import crypto from "node:crypto";
import type { PaymentProvider } from "../types";

/**
 * Ozow (ozow.com) — Instant EFT. Implemented from Ozow's public hosted
 * "Redirect" integration docs (concatenated-field SHA512 hash) — NOT
 * verified against a live merchant account. Re-check the exact field
 * order and which optional fields Ozow expects in the hash before
 * production use; Ozow also offers a richer server-to-server API
 * (requiring OZOW_API_KEY) that's worth preferring over this simpler
 * redirect flow for a real integration.
 *
 * Required env vars: OZOW_SITE_CODE, OZOW_PRIVATE_KEY.
 */

function isConfigured(): boolean {
  return Boolean(process.env.OZOW_SITE_CODE && process.env.OZOW_PRIVATE_KEY);
}

function hashFields(values: string[], privateKey: string): string {
  const concatenated = (values.join("") + privateKey).toLowerCase();
  return crypto.createHash("sha512").update(concatenated).digest("hex");
}

export const ozowProvider: PaymentProvider = {
  id: "ozow",
  label: "Ozow",
  description: "Instant EFT via Ozow.",
  isConfigured,

  async initiate({ orderNumber, amount, returnUrl, cancelUrl, notifyUrl }) {
    if (!isConfigured()) {
      throw new Error("Ozow is not configured — set OZOW_SITE_CODE and OZOW_PRIVATE_KEY.");
    }

    const siteCode = process.env.OZOW_SITE_CODE!;
    const isTest = process.env.OZOW_SANDBOX === "true" ? "true" : "false";
    const fields = {
      SiteCode: siteCode,
      CountryCode: "ZA",
      CurrencyCode: "ZAR",
      Amount: amount.toFixed(2),
      TransactionReference: orderNumber,
      BankReference: `CC${orderNumber}`,
      CancelUrl: cancelUrl,
      ErrorUrl: cancelUrl,
      SuccessUrl: returnUrl,
      NotifyUrl: notifyUrl,
      IsTest: isTest,
    };
    const hashCheck = hashFields(Object.values(fields), process.env.OZOW_PRIVATE_KEY!);
    const query = new URLSearchParams({ ...fields, HashCheck: hashCheck }).toString();

    return {
      redirectUrl: `https://pay.ozow.com?${query}`,
      providerReference: `OZOW-${orderNumber}-${Date.now()}`,
    };
  },

  parseWebhook(rawBody) {
    let payload: Record<string, string>;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      const params = new URLSearchParams(rawBody);
      payload = Object.fromEntries(params.entries());
    }

    const receivedHash = payload.Hash;
    if (!receivedHash) return null;

    const { Hash: _hash, ...fieldsWithoutHash } = payload;
    void _hash;
    const expected = hashFields(Object.values(fieldsWithoutHash), process.env.OZOW_PRIVATE_KEY ?? "");
    if (expected.toLowerCase() !== receivedHash.toLowerCase()) return null;

    const statusRaw = (payload.Status ?? "").toLowerCase();
    const status =
      statusRaw === "complete" ? "paid" : statusRaw === "cancelled" ? "cancelled" : statusRaw === "pending" ? "pending" : "failed";

    return {
      providerReference: payload.TransactionId ?? "",
      orderNumber: payload.TransactionReference,
      status,
      eventId: `ozow:${payload.TransactionId}`,
      raw: payload,
    };
  },
};
