/**
 * Provider-neutral email types. Every template renders down to an
 * `EmailContent` (subject/html/text); every provider adapter (Resend,
 * SendGrid, Postmark, or the local `console` fallback) implements the same
 * `EmailProvider` interface so src/lib/email/send.ts never needs to know
 * which one is actually configured.
 */

export interface EmailAddress {
  name: string;
  email: string;
}

/** What a template produces — always both an HTML and a plain-text body, so a client that can't (or won't) render HTML still gets the message. */
export interface EmailContent {
  subject: string;
  html: string;
  text: string;
  /** Short preview text some clients show next to the subject in the inbox list — set once per template, not user-visible in the body itself. */
  previewText?: string;
}

export interface EmailMessage extends EmailContent {
  to: EmailAddress;
  from: EmailAddress;
  replyTo?: string;
  /** RFC 2369 `List-Unsubscribe` header value — set for the marketing-classified templates (back-in-stock, wishlist reminder, abandoned cart) so a mail client's built-in unsubscribe affordance works, on top of the in-body link. */
  listUnsubscribe?: string;
  /** Free-form metadata a provider can attach to its own delivery/click tracking — not shown to the recipient. */
  tags?: Record<string, string>;
}

export interface EmailProviderResult {
  ok: boolean;
  providerMessageId?: string;
  /** Present when ok is false. */
  error?: string;
  /** True if the failure looks transient (network error, 429, 5xx) and worth retrying; false for something that will fail identically every time (bad address, 4xx validation error, missing credentials). */
  retryable?: boolean;
}

export interface EmailProvider {
  id: "resend" | "sendgrid" | "postmark" | "console";
  send(message: EmailMessage): Promise<EmailProviderResult>;
}

/** The category a template belongs to — drives whether it needs marketing consent and an unsubscribe link. See src/lib/email/send.ts and supabase's newsletter_subscribers/marketing_consent precedent. */
export type EmailCategory = "transactional" | "marketing";
