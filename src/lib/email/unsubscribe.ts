import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { siteConfig } from "@/config/site";

/**
 * One-click unsubscribe, the standard pattern for a marketing email's
 * footer link: no login required, just an HMAC-signed token tying the
 * link to one specific email address so it can't be used to unsubscribe
 * someone else. Requires EMAIL_UNSUBSCRIBE_SECRET in production — falls
 * back to a fixed development-only string (with a console warning) so
 * local preview/testing still works without it configured, the same
 * "degrade, don't crash" pattern as the rest of this app's optional env
 * vars.
 */

function getSecret(): string {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    console.warn("[email:unsubscribe] EMAIL_UNSUBSCRIBE_SECRET is not set — using an insecure development fallback. Set it before sending real marketing email.");
  }
  return "dev-only-insecure-unsubscribe-secret";
}

function sign(email: string): string {
  return createHmac("sha256", getSecret()).update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
}

export function buildUnsubscribeUrl(email: string): string {
  const token = sign(email);
  const params = new URLSearchParams({ email, token });
  return `${siteConfig.url}/unsubscribe?${params.toString()}`;
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = sign(email);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(token || "");
  if (expectedBuf.length !== actualBuf.length) return false;
  return timingSafeEqual(expectedBuf, actualBuf);
}
