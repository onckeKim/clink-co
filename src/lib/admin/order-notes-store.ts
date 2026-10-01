/**
 * In-memory internal order notes — admin-only annotations on an order
 * (e.g. "Called customer re: delayed delivery"), never shown to the
 * customer. Same demo/dev-substitute rationale as every other store here.
 */

export interface OrderNote {
  id: string;
  orderNumber: string;
  authorId: string;
  authorEmail: string;
  note: string;
  createdAt: string;
}

const notes: OrderNote[] = [];

export function listOrderNotes(orderNumber: string): OrderNote[] {
  return notes.filter((n) => n.orderNumber === orderNumber).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addOrderNote(input: {
  orderNumber: string;
  authorId: string;
  authorEmail: string;
  note: string;
}): OrderNote {
  const note: OrderNote = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  notes.push(note);
  return note;
}
