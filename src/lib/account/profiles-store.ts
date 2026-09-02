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
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  marketingConsent: boolean;
  role: "customer" | "admin";
  createdAt: string;
  updatedAt: string;
}

const profilesById = new Map<string, Profile>();

/** Creates a default profile the first time a user is seen (e.g. right after sign-up), otherwise no-ops. */
export function ensureProfile(input: {
  id: string;
  firstName?: string;
  lastName?: string;
  marketingConsent?: boolean;
}): Profile {
  const existing = profilesById.get(input.id);
  if (existing) return existing;

  const now = new Date().toISOString();
  const profile: Profile = {
    id: input.id,
    firstName: input.firstName?.trim() ?? "",
    lastName: input.lastName?.trim() ?? "",
    phone: null,
    dateOfBirth: null,
    marketingConsent: input.marketingConsent ?? false,
    role: "customer",
    createdAt: now,
    updatedAt: now,
  };
  profilesById.set(input.id, profile);
  return profile;
}

export function getProfile(userId: string): Profile | undefined {
  return profilesById.get(userId);
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
