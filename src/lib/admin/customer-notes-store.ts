/**
 * In-memory internal customer notes — admin-only annotations on a customer
 * account, never shown to the customer. Same pattern as order-notes-store.ts.
 */

export interface CustomerNote {
  id: string;
  customerId: string;
  authorId: string;
  authorEmail: string;
  note: string;
  createdAt: string;
}

const notes: CustomerNote[] = [];

export function listCustomerNotes(customerId: string): CustomerNote[] {
  return notes.filter((n) => n.customerId === customerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addCustomerNote(input: {
  customerId: string;
  authorId: string;
  authorEmail: string;
  note: string;
}): CustomerNote {
  const note: CustomerNote = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  notes.push(note);
  return note;
}
