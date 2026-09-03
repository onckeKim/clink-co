import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { getDb } from "./client";
import { DatabaseUnavailableError, mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { AppRole, Database } from "@/lib/supabase/types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export async function getOwnProfile(userId: string): Promise<ProfileRow | null> {
  const db = await getDb();
  const { data, error } = await db.from("profiles").select("*").eq("id", userId).maybeSingle();
  return unwrapNullable({ data, error });
}

/**
 * Only the customer-editable fields are typed here — role/is_disabled/
 * disabled_reason are deliberately excluded from this function's input,
 * not just blocked server-side. They're blocked server-side too
 * (guard_profile_update() in supabase/migrations/20250101000100_identity_and_access.sql
 * raises an exception if a caller without team:write/customers:write
 * changes them), so this is defense in depth, not the only thing standing
 * between a customer and their own role field.
 */
export async function updateOwnProfile(
  userId: string,
  patch: Partial<Pick<ProfileRow, "first_name" | "last_name" | "phone" | "date_of_birth" | "marketing_consent" | "avatar_url">>,
): Promise<ProfileRow> {
  const db = await getDb();
  const { data, error } = await db.from("profiles").update(patch).eq("id", userId).select().single();
  return unwrap({ data, error });
}

/** Staff search — requires customers:view or team:view (profiles_select_staff). */
export async function adminListProfiles(search?: string): Promise<ProfileRow[]> {
  const db = await getDb();
  let query = db.from("profiles").select("*").is("deleted_at", null).order("created_at", { ascending: false });
  if (search) query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
  const { data, error } = await query;
  return unwrap({ data, error });
}

/**
 * Grants (or changes) an admin role — requires team:write (super_admin
 * only, per role_permissions). Writes user_roles, never profiles.role
 * directly; sync_profile_role() (the AFTER trigger on user_roles) is what
 * actually updates profiles.role, keeping that column a read-only cache —
 * see the migration file for the full reasoning. Trying to change your
 * own role fails here the same way it would through the UI: the
 * guard_user_roles_self_change trigger raises before this even reaches
 * the upsert.
 */
export async function setUserRole(userId: string, role: AppRole, grantedBy: string): Promise<void> {
  const db = await getDb();

  if (role === "customer") {
    const { error } = await db.from("user_roles").delete().eq("user_id", userId);
    if (error) throw mapPostgrestError(error);
    return;
  }

  const { error } = await db
    .from("user_roles")
    .upsert({ user_id: userId, role, granted_by: grantedBy }, { onConflict: "user_id" });
  if (error) throw mapPostgrestError(error);
}

/** Requires customers:write (profiles_update_staff). */
export async function setAccountDisabled(userId: string, disabled: boolean, reason?: string): Promise<ProfileRow> {
  const db = await getDb();
  const { data, error } = await db
    .from("profiles")
    .update({ is_disabled: disabled, disabled_reason: disabled ? (reason ?? null) : null })
    .eq("id", userId)
    .select()
    .single();
  return unwrap({ data, error });
}

/**
 * Flips marketing_consent off for the account matching this email —
 * the one-click unsubscribe link handler (POST /api/unsubscribe). Runs
 * unauthenticated (the visitor clicking the link has no session), so this
 * needs the service-role client the same way grantBootstrapAdminRole does;
 * the token itself (verified by the caller before this runs) is what makes
 * this safe to expose with no session.
 */
export async function setMarketingConsentByEmail(email: string, consent: boolean): Promise<void> {
  const db = createServiceClient();
  if (!db) throw new DatabaseUnavailableError();
  const { error } = await db.from("profiles").update({ marketing_consent: consent }).eq("email", email);
  if (error) throw mapPostgrestError(error);
}

/**
 * Self-grants an admin role to a brand-new account whose email matches
 * ADMIN_BOOTSTRAP_EMAILS — the one mechanism for creating the very first
 * admin, since there's no existing admin yet to grant one through
 * /admin/team. Must run through the service-role client: a fresh signup's
 * own session has no team:write permission yet (the RLS policy on
 * user_roles would reject it), and guard_user_roles_self_change() blocks
 * *any* session-scoped write to your own user_roles row regardless of
 * permission — auth.uid() is null for a service-role connection, so that
 * guard doesn't fire here. See src/lib/account/profiles-store.ts's
 * ensureProfile() for the one call site.
 */
export async function grantBootstrapAdminRole(userId: string): Promise<void> {
  const db = createServiceClient();
  if (!db) throw new DatabaseUnavailableError();
  const { error } = await db
    .from("user_roles")
    .upsert({ user_id: userId, role: "super_admin", granted_by: userId }, { onConflict: "user_id" });
  if (error) throw mapPostgrestError(error);
}
