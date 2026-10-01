import "server-only";
import type { EmailMessage, EmailProvider, EmailProviderResult } from "../types";

const RESEND_API_URL = "https://api.resend.com/emails";

/** https://resend.com/docs/api-reference/emails/send-email */
export const resendProvider: EmailProvider = {
  id: "resend",
  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return { ok: false, error: "RESEND_API_KEY is not set", retryable: false };

    try {
      const response = await fetch(RESEND_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${message.from.name} <${message.from.email}>`,
          to: [`${message.to.name} <${message.to.email}>`],
          reply_to: message.replyTo,
          subject: message.subject,
          html: message.html,
          text: message.text,
          headers: message.listUnsubscribe ? { "List-Unsubscribe": message.listUnsubscribe } : undefined,
          tags: message.tags ? Object.entries(message.tags).map(([name, value]) => ({ name, value })) : undefined,
        }),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return {
          ok: false,
          error: `Resend API error ${response.status}: ${body.slice(0, 300)}`,
          retryable: response.status === 429 || response.status >= 500,
        };
      }

      const data = (await response.json().catch(() => ({}))) as { id?: string };
      return { ok: true, providerMessageId: data.id };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Network error", retryable: true };
    }
  },
};
