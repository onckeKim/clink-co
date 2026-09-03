import "server-only";
import type { EmailProvider } from "../types";
import { resendProvider } from "./resend";
import { sendgridProvider } from "./sendgrid";
import { postmarkProvider } from "./postmark";
import { consoleProvider } from "./console";

const providers: Record<EmailProvider["id"], EmailProvider> = {
  resend: resendProvider,
  sendgrid: sendgridProvider,
  postmark: postmarkProvider,
  console: consoleProvider,
};

/**
 * Resolves which provider actually sends the email — this is the entire
 * "provider-neutral" switch point; nothing else in the codebase imports a
 * specific provider module directly.
 *
 * - `EMAIL_PROVIDER=resend|sendgrid|postmark|console` picks explicitly.
 * - Left unset, the first provider whose API key is present wins (Resend,
 *   then SendGrid, then Postmark) — the same "pick whichever's configured"
 *   behavior the rest of this app's payment providers already use (see
 *   src/lib/payments/index.ts's isConfigured() pattern).
 * - With nothing configured at all, falls back to `console`, which never
 *   fails and writes a local preview instead of sending — see
 *   src/lib/email/providers/console.ts.
 */
export function getEmailProvider(): EmailProvider {
  const explicit = process.env.EMAIL_PROVIDER as EmailProvider["id"] | undefined;
  if (explicit && explicit in providers) return providers[explicit];

  if (process.env.RESEND_API_KEY) return resendProvider;
  if (process.env.SENDGRID_API_KEY) return sendgridProvider;
  if (process.env.POSTMARK_SERVER_TOKEN) return postmarkProvider;
  return consoleProvider;
}

export type { EmailProvider };
