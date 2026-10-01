import "server-only";
import type { Role } from "@/lib/admin/roles";
import { getBootstrapAdminEmails } from "@/lib/admin/roles";
import * as db from "@/lib/db/profiles";
import type { Database } from "@/lib/supabase/types";

/**
 * Thin async wrapper over src/lib/db/profiles.ts (the real, RLS-backed
 * `profiles` table) — kept as its own module, at its original import path,
 * so every existing call site only had to add `await`, not change what it
 * imports. Translates between the DB row's snake_case columns and this
 * app's existing camelCase Profile shape.
 */

export interface Profile {
  id: string;
  email: string | null;
  firstName: string;
  lastName: string;
  phone: string | null;
  dateOfBirth: string | null;
  marketingConsent: boolean;
  role: Role;
  isDisabled: boolean;
  disabledReason: string | null;
  createdAt: string;
  updatedAt: string;
}

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function fromRow(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name ?? "",
    lastName: row.last_name ?? "",
    phone: row.phone,
    dateOfBirth: row.date_of_birth,
    marketingConsent: row.marketing_consent,
    role: row.role,
    isDisabled: row.is_disabled,
    disabledReason: row.disabled_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Confirms a profile exists for this account (it already does by the time
 * this runs — the DB's `handle_new_user()` trigger creates the row
 * transactionally as part of Auth sign-up, before any app code sees the new
 * user) and, the first time a bootstrap-eligible email is seen, promotes it
 * to super_admin. Every other field (name, marketing consent) is already
 * set from Auth signup metadata by the trigger; this function no longer
 * needs to pass them through.
 */
export async function ensureProfile(input: {
  id: string;
  email?: string | null;
  firstName?: string;
  lastName?: string;
  marketingConsent?: boolean;
}): Promise<Profile> {
  const existing = await db.getOwnProfile(input.id);
  if (!existing) {
    // The auth trigger fires transactionally on signup, so this should be
    // unreachable in practice — surfaced loudly rather than silently
    // treated as "not signed up yet", since it means the trigger didn't run.
    throw new Error(`No profile row exists for user ${input.id} — the handle_new_user() trigger should have created one.`);
  }

  const isBootstrapAdmin = Boolean(existing.email) && getBootstrapAdminEmails().has(existing.email!.trim().toLowerCase());
  if (isBootstrapAdmin && existing.role === "customer") {
    await db.grantBootstrapAdminRole(input.id);
    const promoted = await db.getOwnProfile(input.id);
    return fromRow(promoted!);
  }

  return fromRow(existing);
}

export async function getProfile(userId: string): Promise<Profile | undefined> {
  const row = await db.getOwnProfile(userId);
  return row ? fromRow(row) : undefined;
}

export async function listProfiles(search?: string): Promise<Profile[]> {
  const rows = await db.adminListProfiles(search);
  return rows.map(fromRow);
}

export async function updateProfile(
  userId: string,
  patch: Partial<Pick<Profile, "firstName" | "lastName" | "phone" | "dateOfBirth" | "marketingConsent">>,
): Promise<Profile> {
  const row = await db.updateOwnProfile(userId, {
    first_name: patch.firstName,
    last_name: patch.lastName,
    phone: patch.phone,
    date_of_birth: patch.dateOfBirth,
    marketing_consent: patch.marketingConsent,
  });
  return fromRow(row);
}

/** Admin-only mutations — role changes (/admin/team) and account disable/enable (/admin/customers). */
export async function setProfileRole(userId: string, role: Role, grantedBy: string): Promise<Profile | undefined> {
  await db.setUserRole(userId, role, grantedBy);
  const row = await db.getOwnProfile(userId);
  return row ? fromRow(row) : undefined;
}

export async function setProfileDisabled(userId: string, isDisabled: boolean, reason?: string): Promise<Profile | undefined> {
  const row = await db.setAccountDisabled(userId, isDisabled, reason);
  return fromRow(row);
}
