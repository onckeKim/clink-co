import "server-only";
import { metaCloudApiProvider } from "./provider";
import type { WhatsAppMessage, WhatsAppSendResult } from "./types";

/**
 * The one entry point anything wanting to send a WhatsApp notification
 * must go through — it never sends unless every one of these holds:
 *
 *   1. WHATSAPP_ENABLED=true is set (the master switch — absent or any
 *      other value means off, fail closed).
 *   2. `hasConsent` is explicitly true, passed by the CALLER, not assumed
 *      here. There is deliberately no fallback default and no attempt to
 *      infer consent from marketing_consent or anything else — a
 *      WhatsApp message is a different channel with its own opt-in, and
 *      "do not activate automated WhatsApp messages without explicit
 *      customer consent" means this function refuses to guess.
 *   3. The provider's own credential check passes (WHATSAPP_ACCESS_TOKEN /
 *      WHATSAPP_PHONE_NUMBER_ID) — see provider.ts.
 *
 * Like sendTransactionalEmail(), this never throws: a failed or
 * unconfigured send must not fail whatever business action triggered it.
 */
export async function sendWhatsAppNotification(input: { message: WhatsAppMessage; hasConsent: boolean }): Promise<WhatsAppSendResult> {
  if (process.env.WHATSAPP_ENABLED !== "true") {
    console.log(`[whatsapp:disabled] Would send "${input.message.templateName}" to ${input.message.to.name} — WHATSAPP_ENABLED is not "true".`);
    return { sent: false, reason: "WhatsApp notifications are not enabled (WHATSAPP_ENABLED is not \"true\")." };
  }

  if (!input.hasConsent) {
    console.warn(`[whatsapp:blocked] Refused to send "${input.message.templateName}" to ${input.message.to.name} — no explicit consent.`);
    return { sent: false, reason: "Customer has not given explicit consent for WhatsApp messages." };
  }

  const result = await metaCloudApiProvider.send(input.message);
  if (!result.sent) {
    console.error(`[whatsapp:failed] "${input.message.templateName}" to ${input.message.to.name}: ${result.reason}`);
  }
  return result;
}
