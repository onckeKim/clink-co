import type { Profile } from "@/lib/account/profiles-store";
import { listProfiles, getProfile } from "@/lib/account/profiles-store";
import { getOrdersByUserId } from "@/lib/orders/store";

/**
 * Admin-facing customer reads — composes the profiles store with the
 * orders store (spend/order-count are derived, not stored) rather than
 * being its own store. /admin/customers and /api/admin/customers/**.
 */

export interface AdminCustomerSummary extends Profile {
  totalSpend: number;
  orderCount: number;
  lastOrderAt: string | null;
}

/** Orders that count toward a customer's spend — a pending/failed/cancelled order was never actually paid. */
const PAID_STATUSES = new Set(["paid", "fulfilled"]);

async function toSummary(profile: Profile): Promise<AdminCustomerSummary> {
  const orders = await getOrdersByUserId(profile.id);
  const totalSpend = orders
    .filter((order) => PAID_STATUSES.has(order.status))
    .reduce((sum, order) => sum + order.total, 0);

  return {
    ...profile,
    totalSpend,
    orderCount: orders.length,
    lastOrderAt: orders[0]?.createdAt ?? null,
  };
}

export interface AdminCustomerFilters {
  search?: string;
}

/** Every customer-role profile (staff accounts are managed from /admin/team, not here), most recently created first. */
export async function listAdminCustomers(filters?: AdminCustomerFilters): Promise<AdminCustomerSummary[]> {
  let profiles = (await listProfiles()).filter((p) => p.role === "customer");

  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    profiles = profiles.filter(
      (p) =>
        (p.email ?? "").toLowerCase().includes(q) ||
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q),
    );
  }

  return Promise.all(profiles.map(toSummary));
}

export async function getAdminCustomerById(id: string): Promise<AdminCustomerSummary | undefined> {
  const profile = await getProfile(id);
  return profile ? toSummary(profile) : undefined;
}
