/**
 * In-memory newsletter subscriber list — same "seeded, resets on
 * restart" trade-off documented in src/lib/rate-limit.ts, matching every
 * other in-memory store in this app until the `newsletter_subscribers`
 * Supabase table (see supabase/migrations) is wired in.
 */

export interface NewsletterSubscriber {
  email: string;
  subscribedAt: string;
  source: string;
}

const subscribers = new Map<string, NewsletterSubscriber>();

/** Adds an email if it isn't already subscribed. Returns whether it was newly added. */
export function subscribeToNewsletter(email: string, source: string): boolean {
  const key = email.trim().toLowerCase();
  if (subscribers.has(key)) return false;
  subscribers.set(key, { email: key, subscribedAt: new Date().toISOString(), source });
  return true;
}

export function listNewsletterSubscribers(): NewsletterSubscriber[] {
  return Array.from(subscribers.values()).sort((a, b) => b.subscribedAt.localeCompare(a.subscribedAt));
}
