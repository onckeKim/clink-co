import "server-only";
import type { WhatsAppMessage, WhatsAppProvider, WhatsAppSendResult } from "./types";

/**
 * WhatsApp Business Cloud API (Meta's own, no third-party middleman) —
 * https://developers.facebook.com/docs/whatsapp/cloud-api/reference/messages.
 * Structured the same way as src/lib/email/providers/*.ts (a single
 * `send()` method) so a different provider (Twilio, 360dialog, etc.) is a
 * drop-in second file, not a rewrite — the interface is what matters, not
 * this specific implementation.
 */
export const metaCloudApiProvider: WhatsAppProvider = {
  async send(message: WhatsAppMessage): Promise<WhatsAppSendResult> {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!accessToken || !phoneNumberId) {
      return { sent: false, reason: "WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not set" };
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: message.to.phone.replace(/[^\d+]/g, ""),
          type: "template",
          template: {
            name: message.templateName,
            language: { code: "en" },
            components: [
              {
                type: "body",
                parameters: message.templateParams.map((text) => ({ type: "text", text })),
              },
            ],
          },
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return { sent: false, reason: `WhatsApp API error ${response.status}: ${body.slice(0, 300)}` };
      }

      const data = (await response.json().catch(() => ({}))) as { messages?: { id?: string }[] };
      return { sent: true, providerMessageId: data.messages?.[0]?.id };
    } catch (error) {
      return { sent: false, reason: error instanceof Error ? error.message : "Network error" };
    }
  },
};
