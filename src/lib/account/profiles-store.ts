import { type Role, getBootstrapAdminEmails } from "@/lib/admin/roles";

/**
 * In-memory profiles store — a development/demo substitute for a real
 * `profiles` table (see the `Database["public"]["Tables"]["profiles"]`
 * shape in src/lib/supabase/types.ts, which documents the target schema).
 * Deliberately NOT production-safe for the same reasons as
 * src/lib/orders/store.ts: it resets on restart and doesn't share state
 * across serverless instances.
 *
 * Authentication itself is real (Supabase Auth) — only this profile *data*
 * (name, phone, DOB, marketing consent, role) is stored here rather than in
 * a live Postgres table, since provisioning that table requires access to
 * the project's Supabase dashboard/migrations that this environment doesn't
 * have. Every function is keyed by the real, Supabase-Auth-issued user id,
 * so moving to a real `profiles` table later is a drop-in swap of these
 * function bodies for `supabase.from("profiles")` queries — call sites
 * don't change.
 */

export interface Profile {
  id: string;
  /** Persisted from Supabase Auth at profile-creation time (see ensureProfile) so admin surfaces (customer list/search, audit log) can read it without a service-role Supabase Admin API call this dev environment doesn't have credentials for. */
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  marketingConsent: boolean;
  role: Role;
  /** Blocks login (checked in POST /api/auth/login) — see /admin/customers. Never deletes the account or its history. */
  isDisabled: boolean;
  disabledReason: string | null;
  createdAt: string;
  updatedAt: string;
}

const profilesById = new Map<string, Profile>();

/**
 * Creates a default profile the first time a user is seen (e.g. right after
 * sign-up), otherwise no-ops. Passing `email` lets a fresh profile be
 * auto-granted `super_admin` when it matches ADMIN_BOOTSTRAP_EMAILS — the
 * one bootstrap mechanism for granting the very first admin, since there's
 * no existing admin yet to do it through /admin/team. See .env.local.example.
 */
export function ensureProfile(input: {
  id: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  marketingConsent?: boolean;
}): Profile {
  const existing = profilesById.get(input.id);
  if (existing) return existing;

  const isBootstrapAdmin = Boolean(input.email) && getBootstrapAdminEmails().has(input.email!.trim().toLowerCase());

  const now = new Date().toISOString();
  const profile: Profile = {
    id: input.id,
    email: input.email?.trim() || null,
    firstName: input.firstName?.trim() ?? "",
    lastName: input.lastName?.trim() ?? "",
    phone: null,
    dateOfBirth: null,
    marketingConsent: input.marketingConsent ?? false,
    role: isBootstrapAdmin ? "super_admin" : "customer",
    isDisabled: false,
    disabledReason: null,
    createdAt: now,
    updatedAt: now,
  };
  profilesById.set(input.id, profile);
  return profile;
}

export function getProfile(userId: string): Profile | undefined {
  return profilesById.get(userId);
}

export function listProfiles(): Profile[] {
  return [...profilesById.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, "firstName" | "lastName" | "phone" | "dateOfBirth" | "marketingConsent">>,
): Profile {
  const existing = ensureProfile({ id: userId });
  const updated: Profile = { ...existing, ...patch, updatedAt: new Date().toISOString() };
  profilesById.set(userId, updated);
  return updated;
}

/** Admin-only mutations — role changes (/admin/team) and account disable/enable (/admin/customers). */
export function setProfileRole(userId: string, role: Role): Profile | undefined {
  const existing = profilesById.get(userId);
  if (!existing) return undefined;
  const updated: Profile = { ...existing, role, updatedAt: new Date().toISOString() };
  profilesById.set(userId, updated);
  return updated;
}

export function setProfileDisabled(userId: string, isDisabled: boolean, reason?: string): Profile | undefined {
  const existing = profilesById.get(userId);
  if (!existing) return undefined;
  const updated: Profile = {
    ...existing,
    isDisabled,
    disabledReason: isDisabled ? (reason?.trim() || null) : null,
    updatedAt: new Date().toISOString(),
  };
  profilesById.set(userId, updated);
  return updated;
}
