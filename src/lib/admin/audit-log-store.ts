/**
 * In-memory audit log — a development/demo substitute for a real
 * `audit_log` table, same rationale as every other store in this codebase
 * (src/lib/orders/store.ts, src/lib/account/*.ts): resets on restart, no
 * cross-instance sharing. Every admin mutation across the dashboard calls
 * `recordAuditLog()` — see the individual admin API routes for call sites.
 */

export type AuditEntityType =
  | "product"
  | "category"
  | "collection"
  | "coupon"
  | "order"
  | "customer"
  | "content"
  | "media"
  | "settings"
  | "team_member";

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  /** Short, human-readable verb phrase, e.g. "Updated product price", "Disabled customer account". */
  action: string;
  entityType: AuditEntityType;
  /** The affected record's id/slug/order number — whatever is most useful to look it up again. */
  entityId: string;
  /** Human-readable label for the record, e.g. the product name or order number, so the log reads without a join. */
  entityLabel: string;
  /** JSON-serializable snapshot of the changed fields before the change (undefined for a create). */
  before?: unknown;
  /** JSON-serializable snapshot of the changed fields after the change (undefined for a delete). */
  after?: unknown;
  at: string;
}

const entries: AuditLogEntry[] = [];

export function recordAuditLog(input: {
  userId: string;
  userEmail: string;
  action: string;
  entityType: AuditEntityType;
  entityId: string;
  entityLabel: string;
  before?: unknown;
  after?: unknown;
}): AuditLogEntry {
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    at: new Date().toISOString(),
    ...input,
  };
  // Newest first, and capped so this demo store can't grow unbounded across
  // a long-running dev session — a real table would just paginate a query.
  entries.unshift(entry);
  if (entries.length > 2000) entries.length = 2000;
  return entry;
}

export function listAuditLog(filters?: {
  entityType?: AuditEntityType;
  userId?: string;
  search?: string;
  limit?: number;
}): AuditLogEntry[] {
  let result = entries;
  if (filters?.entityType) result = result.filter((e) => e.entityType === filters.entityType);
  if (filters?.userId) result = result.filter((e) => e.userId === filters.userId);
  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (e) =>
          e.action.toLowerCase().includes(q) ||
          e.entityLabel.toLowerCase().includes(q) ||
          e.entityId.toLowerCase().includes(q) ||
          e.userEmail.toLowerCase().includes(q),
      );
    }
  }
  return filters?.limit ? result.slice(0, filters.limit) : result;
}
