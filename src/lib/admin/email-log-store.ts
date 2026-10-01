/**
 * In-memory email event log — a development/demo substitute for a real
 * `email_events` table, same rationale and limitations as every other
 * store under src/lib/admin/ (resets on restart, doesn't share state
 * across serverless instances). Every send attempt made through
 * src/lib/email/send.ts is recorded here, success or failure, so "did
 * this customer actually get their order confirmation" has an answer
 * queryable from the admin side rather than only living in server logs.
 */

export type EmailEventStatus = "sent" | "failed";

export interface EmailEvent {
  id: string;
  templateKey: string;
  category: "transactional" | "marketing";
  to: string;
  subject: string;
  status: EmailEventStatus;
  provider: string;
  providerMessageId?: string;
  /** Total attempts made, including the one that finally succeeded (or the last one, if all failed) — see src/lib/email/send.ts's retry loop. */
  attempts: number;
  error?: string;
  /** Loosely typed on purpose — an order number, a product slug, a return id, whatever the triggering entity's natural identifier is, for cross-referencing from an order/customer detail view. */
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}

const events: EmailEvent[] = [];
const MAX_EVENTS = 2000;

export function recordEmailEvent(input: Omit<EmailEvent, "id" | "createdAt">): EmailEvent {
  const event: EmailEvent = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  events.unshift(event);
  // Bounded so a runaway sender (or a long-lived dev server) can't grow
  // this without limit — same reasoning as any other in-memory log here.
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
  return event;
}

export interface EmailLogFilters {
  status?: EmailEventStatus;
  templateKey?: string;
  /** Matches recipient email or subject, case-insensitive substring. */
  search?: string;
}

export function listEmailEvents(filters?: EmailLogFilters): EmailEvent[] {
  let list = events;
  if (filters?.status) list = list.filter((e) => e.status === filters.status);
  if (filters?.templateKey) list = list.filter((e) => e.templateKey === filters.templateKey);
  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter((e) => e.to.toLowerCase().includes(q) || e.subject.toLowerCase().includes(q));
  }
  return list;
}

/** Has an email of this template already been sent for this entity? Used by the abandoned-cart/wishlist-reminder/review-request cron jobs so a re-run of the same scan never double-sends. */
export function hasSentEmailFor(templateKey: string, relatedEntityId: string): boolean {
  return events.some((e) => e.templateKey === templateKey && e.relatedEntityId === relatedEntityId && e.status === "sent");
}
