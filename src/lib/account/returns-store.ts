/**
 * In-memory return-request store — a development/demo substitute for a
 * real `return_requests` table, same rationale as the other account
 * stores. One active request per order is enough for this demo; a real
 * implementation would support a status lifecycle (requested → approved →
 * received → refunded) driven by an admin/support workflow, which doesn't
 * exist yet in this build.
 */

export type ReturnReason = "changed-mind" | "damaged" | "wrong-item" | "not-as-described" | "other";

export interface ReturnRequest {
  id: string;
  orderNumber: string;
  userId: string;
  reason: ReturnReason;
  notes: string | null;
  status: "requested";
  createdAt: string;
}

const returnsByOrderNumber = new Map<string, ReturnRequest>();

export function getReturnRequest(orderNumber: string): ReturnRequest | undefined {
  return returnsByOrderNumber.get(orderNumber);
}

/** Every return request, most recent first — every entry is "pending" today since there's no approve/receive/refund lifecycle yet (see the module comment above). Used by the admin dashboard's "Pending returns" stat. */
export function listReturnRequests(): ReturnRequest[] {
  return [...returnsByOrderNumber.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createReturnRequest(input: {
  orderNumber: string;
  userId: string;
  reason: ReturnReason;
  notes?: string;
}): ReturnRequest {
  const existing = returnsByOrderNumber.get(input.orderNumber);
  if (existing) return existing;

  const request: ReturnRequest = {
    id: crypto.randomUUID(),
    orderNumber: input.orderNumber,
    userId: input.userId,
    reason: input.reason,
    notes: input.notes?.trim() || null,
    status: "requested",
    createdAt: new Date().toISOString(),
  };
  returnsByOrderNumber.set(input.orderNumber, request);
  return request;
}
