import type { SouthAfricanProvince } from "@/data/provinces";

/**
 * In-memory address book store — a development/demo substitute for a real
 * `addresses` table (see src/lib/supabase/types.ts). Same rationale and
 * limitations as src/lib/account/profiles-store.ts. Keyed by the real
 * Supabase-Auth user id, so every function here already enforces
 * per-customer isolation: a userId can only ever see/mutate its own rows.
 */

export interface Address {
  id: string;
  userId: string;
  label: string | null;
  fullName: string;
  line1: string;
  line2: string | null;
  suburb: string;
  city: string;
  province: SouthAfricanProvince;
  postalCode: string;
  phone: string;
  isDefaultDelivery: boolean;
  isDefaultBilling: boolean;
  createdAt: string;
  updatedAt: string;
}

const addressesById = new Map<string, Address>();

export function listAddresses(userId: string): Address[] {
  return [...addressesById.values()]
    .filter((address) => address.userId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getAddress(userId: string, id: string): Address | undefined {
  const address = addressesById.get(id);
  return address && address.userId === userId ? address : undefined;
}

export type AddressInput = Omit<
  Address,
  "id" | "userId" | "isDefaultDelivery" | "isDefaultBilling" | "createdAt" | "updatedAt"
> & {
  isDefaultDelivery?: boolean;
  isDefaultBilling?: boolean;
};

/** If this is the customer's first saved address, or the input explicitly asks, it becomes a default. */
export function createAddress(userId: string, input: AddressInput): Address {
  const existing = listAddresses(userId);
  const now = new Date().toISOString();
  const address: Address = {
    ...input,
    id: crypto.randomUUID(),
    userId,
    label: input.label?.trim() || null,
    line2: input.line2?.trim() || null,
    isDefaultDelivery: input.isDefaultDelivery ?? existing.length === 0,
    isDefaultBilling: input.isDefaultBilling ?? existing.length === 0,
    createdAt: now,
    updatedAt: now,
  };

  if (address.isDefaultDelivery) clearDefault(userId, "isDefaultDelivery");
  if (address.isDefaultBilling) clearDefault(userId, "isDefaultBilling");

  addressesById.set(address.id, address);
  return address;
}

export function updateAddress(userId: string, id: string, patch: Partial<AddressInput>): Address | undefined {
  const existing = getAddress(userId, id);
  if (!existing) return undefined;

  if (patch.isDefaultDelivery) clearDefault(userId, "isDefaultDelivery");
  if (patch.isDefaultBilling) clearDefault(userId, "isDefaultBilling");

  const updated: Address = {
    ...existing,
    ...patch,
    label: patch.label !== undefined ? patch.label?.trim() || null : existing.label,
    line2: patch.line2 !== undefined ? patch.line2?.trim() || null : existing.line2,
    updatedAt: new Date().toISOString(),
  };
  addressesById.set(id, updated);
  return updated;
}

export function deleteAddress(userId: string, id: string): boolean {
  const existing = getAddress(userId, id);
  if (!existing) return false;
  addressesById.delete(id);

  // If the deleted address was a default, promote the next-oldest remaining
  // address (if any) so the customer always has a default once they have
  // at least one saved address.
  const remaining = listAddresses(userId);
  if (existing.isDefaultDelivery && remaining.length > 0 && !remaining.some((a) => a.isDefaultDelivery)) {
    setDefault(userId, remaining[0]!.id, "isDefaultDelivery");
  }
  if (existing.isDefaultBilling && remaining.length > 0 && !remaining.some((a) => a.isDefaultBilling)) {
    setDefault(userId, remaining[0]!.id, "isDefaultBilling");
  }
  return true;
}

function clearDefault(userId: string, field: "isDefaultDelivery" | "isDefaultBilling") {
  for (const address of listAddresses(userId)) {
    if (address[field]) addressesById.set(address.id, { ...address, [field]: false });
  }
}

export function setDefault(
  userId: string,
  id: string,
  field: "isDefaultDelivery" | "isDefaultBilling",
): Address | undefined {
  const existing = getAddress(userId, id);
  if (!existing) return undefined;
  clearDefault(userId, field);
  const updated: Address = { ...existing, [field]: true, updatedAt: new Date().toISOString() };
  addressesById.set(id, updated);
  return updated;
}
