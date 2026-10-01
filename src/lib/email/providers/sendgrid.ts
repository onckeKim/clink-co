import "server-only";
import type { EmailMessage, EmailProvider, EmailProviderResult } from "../types";

const SENDGRID_API_URL = "https://api.sendgrid.com/v3/mail/send";

/** https://docs.sendgrid.com/api-reference/mail-send/mail-send */
export const sendgridProvider: EmailProvider = {
  id: "sendgrid",
  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return { ok: false, error: "SENDGRID_API_KEY is not set", retryable: false };

    try {
      const response = await fetch(SENDGRID_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: message.to.email, name: message.to.name }] }],
          from: { email: message.from.email, name: message.from.name },
          reply_to: message.replyTo ? { email: message.replyTo } : undefined,
          subject: message.subject,
          content: [
            { type: "text/plain", value: message.text },
            { type: "text/html", value: message.html },
          ],
          headers: message.listUnsubscribe ? { "List-Unsubscribe": message.listUnsubscribe } : undefined,
          categories: message.tags ? Object.values(message.tags).slice(0, 10) : undefined,
        }),
      });

      // SendGrid returns 202 with an empty body on success and an
      // `X-Message-Id` header rather than a JSON id in the body.
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        return {
          ok: false,
          error: `SendGrid API error ${response.status}: ${body.slice(0, 300)}`,
          retryable: response.status === 429 || response.status >= 500,
        };
      }

      return { ok: true, providerMessageId: response.headers.get("x-message-id") ?? undefined };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Network error", retryable: true };
    }
  },
};
