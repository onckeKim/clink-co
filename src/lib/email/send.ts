import "server-only";
import { siteConfig } from "@/config/site";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { recordEmailEvent } from "@/lib/admin/email-log-store";
import { getEmailProvider } from "./providers";
import type { EmailAddress, EmailCategory, EmailContent, EmailProviderResult } from "./types";

/** Up to 3 attempts total, with exponential-ish backoff between retryable failures only — a 4xx/misconfiguration failure is retried zero extra times (it will fail identically every time), while a network blip or a provider's 429/5xx gets a couple of chances to clear on its own. */
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [500, 1500];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SendTransactionalEmailInput {
  to: EmailAddress;
  content: EmailContent;
  category: EmailCategory;
  /** Stable key identifying which template this is (e.g. "order-confirmation") — see src/lib/email/templates/registry.ts for the canonical list. Recorded on the event log entry. */
  templateKey: string;
  /** Required for a "marketing" category send — see src/lib/email/abandoned-cart.ts for how one is minted. */
  unsubscribeUrl?: string;
  replyTo?: string;
  /** For cross-referencing from an order/customer/product detail view, and for hasSentEmailFor() idempotency checks (abandoned cart, wishlist reminder, review request). */
  relatedEntityType?: string;
  relatedEntityId?: string;
}

export interface SendTransactionalEmailResult {
  ok: boolean;
  attempts: number;
  providerMessageId?: string;
  error?: string;
}

/**
 * The one function every template-triggering call site should go through
 * — never a provider module directly. Resolves the from-address from live
 * store settings, retries transient provider failures with backoff, logs
 * every attempt's outcome (success or final failure) to the email event
 * log, and never throws: a failed or unconfigured send must not fail
 * whatever business action triggered it (placing an order, cancelling
 * one, requesting a return, ...) — the caller gets a result object back to
 * inspect if it cares, not an exception to catch.
 */
export async function sendTransactionalEmail(input: SendTransactionalEmailInput): Promise<SendTransactionalEmailResult> {
  const provider = getEmailProvider();
  const settings = await getStoreSettings();
  const fromHost = (() => {
    try {
      return new URL(siteConfig.url).hostname;
    } catch {
      return "clinkandco.com";
    }
  })();

  if (input.category === "marketing" && !input.unsubscribeUrl) {
    console.error(`[email:blocked] "${input.templateKey}" is a marketing email but has no unsubscribeUrl — refusing to send.`);
    recordEmailEvent({
      templateKey: input.templateKey,
      category: input.category,
      to: input.to.email,
      subject: input.content.subject,
      status: "failed",
      provider: provider.id,
      attempts: 0,
      error: "Marketing email missing required unsubscribe link.",
      relatedEntityType: input.relatedEntityType,
      relatedEntityId: input.relatedEntityId,
    });
    return { ok: false, attempts: 0, error: "Marketing email missing required unsubscribe link." };
  }

  let result: EmailProviderResult = { ok: false, error: "Not attempted", retryable: false };
  let attempts = 0;

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    attempts += 1;
    result = await provider.send({
      ...input.content,
      to: input.to,
      from: { name: settings.emailSenderName || siteConfig.name, email: `${settings.emailSenderLocalPart || "hello"}@${fromHost}` },
      replyTo: input.replyTo ?? settings.contactEmail,
      listUnsubscribe: input.category === "marketing" && input.unsubscribeUrl ? `<${input.unsubscribeUrl}>` : undefined,
      tags: { template: input.templateKey },
    });

    if (result.ok || !result.retryable || i === MAX_ATTEMPTS - 1) break;
    console.warn(`[email:retry] "${input.templateKey}" to ${input.to.email} — attempt ${attempts} failed (${result.error}), retrying...`);
    await sleep(RETRY_DELAYS_MS[i] ?? 4000);
  }

  if (!result.ok) {
    console.error(`[email:failed] "${input.templateKey}" to ${input.to.email} after ${attempts} attempt(s): ${result.error}`);
  }

  recordEmailEvent({
    templateKey: input.templateKey,
    category: input.category,
    to: input.to.email,
    subject: input.content.subject,
    status: result.ok ? "sent" : "failed",
    provider: provider.id,
    providerMessageId: result.providerMessageId,
    attempts,
    error: result.error,
    relatedEntityType: input.relatedEntityType,
    relatedEntityId: input.relatedEntityId,
  });

  return { ok: result.ok, attempts, providerMessageId: result.providerMessageId, error: result.error };
}
