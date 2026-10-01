import "server-only";
import type { EmailMessage, EmailProvider, EmailProviderResult } from "../types";

const POSTMARK_API_URL = "https://api.postmarkapp.com/email";

/** https://postmarkapp.com/developer/api/email-api */
export const postmarkProvider: EmailProvider = {
  id: "postmark",
  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const token = process.env.POSTMARK_SERVER_TOKEN;
    if (!token) return { ok: false, error: "POSTMARK_SERVER_TOKEN is not set", retryable: false };

    try {
      const response = await fetch(POSTMARK_API_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": token,
        },
        body: JSON.stringify({
          From: `${message.from.name} <${message.from.email}>`,
          To: `${message.to.name} <${message.to.email}>`,
          ReplyTo: message.replyTo,
          Subject: message.subject,
          HtmlBody: message.html,
          TextBody: message.text,
          Headers: message.listUnsubscribe ? [{ Name: "List-Unsubscribe", Value: message.listUnsubscribe }] : undefined,
          MessageStream: "outbound",
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { MessageID?: string; Message?: string; ErrorCode?: number };

      if (!response.ok || data.ErrorCode) {
        return {
          ok: false,
          error: `Postmark API error ${data.ErrorCode ?? response.status}: ${data.Message ?? "Unknown error"}`,
          retryable: response.status === 429 || response.status >= 500,
        };
      }

      return { ok: true, providerMessageId: data.MessageID };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : "Network error", retryable: true };
    }
  },
};
