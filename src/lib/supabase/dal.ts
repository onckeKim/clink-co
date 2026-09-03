import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getProfile, type Profile } from "@/lib/account/profiles-store";
import { isAdminRole, hasPermission, type Permission } from "@/lib/admin/roles";

/**
 * Data Access Layer for auth — the single place server code asks "who is
 * this?" `getUser()` always re-validates the JWT against the Supabase Auth
 * server (unlike reading the session straight from the cookie), so it's
 * safe to use for real authorization decisions, not just optimistic UI.
 * Wrapped in React's `cache()` so multiple calls within one request/render
 * pass reuse a single network round trip.
 */
export const getUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    // A disabled account (see /admin/customers) is treated as signed out
    // everywhere from this point on, even if it's mid-session — an admin
    // disabling an account should cut off access immediately, not just
    // block the next login attempt (see POST /api/auth/login).
    const profile = getProfile(user.id);
    if (profile?.isDisabled) return null;

    return user;
  } catch {
    // Supabase env vars aren't set in this environment — there's no way to
    // have a valid session, so this is equivalent to "not signed in" rather
    // than a hard failure. Every protected page/route degrades to its
    // signed-out state instead of crashing.
    return null;
  }
});

/** Redirects to /login (preserving the attempted path) if there's no authenticated user. Use in Server Components/layouts that must be logged-in-only. */
export async function requireUser(redirectTo = "/login"): Promise<User> {
  const user = await getUser();
  if (!user) redirect(redirectTo);
  return user;
}

/**
 * Requires any admin role (the six roles in src/lib/admin/roles.ts) — the
 * gate for /admin/layout.tsx. A signed-in customer with no admin role is
 * redirected to /account, not /login (they're authenticated, just not
 * authorized), matching how a "you don't have access" case should read
 * differently from "please sign in".
 */
export async function requireAdmin(redirectTo = "/account"): Promise<{ user: User; profile: Profile }> {
  const user = await requireUser("/login?redirect=/admin");
  const profile = getProfile(user.id);
  if (!profile || !isAdminRole(profile.role)) redirect(redirectTo);
  return { user, profile };
}

/** Requires a specific permission (see src/lib/admin/roles.ts) — use in individual admin pages/route handlers on top of the broader requireAdmin() layout guard, so a role with partial access (e.g. content_editor) is redirected/rejected from sections its role doesn't cover. */
export async function requirePermission(
  permission: Permission,
  redirectTo = "/admin",
): Promise<{ user: User; profile: Profile }> {
  const { user, profile } = await requireAdmin();
  if (!hasPermission(profile.role, permission)) redirect(redirectTo);
  return { user, profile };
}

/**
 * The non-redirecting counterpart to requireAdmin/requirePermission, for
 * /api/admin/** route handlers — a JSON API should return 401/403, not an
 * HTTP redirect. Returns null if there's no session or the account has no
 * admin role; the caller decides the status code (typically 401 vs 403).
 */
export async function getAdminContext(): Promise<{ user: User; profile: Profile } | null> {
  const user = await getUser();
  if (!user) return null;
  const profile = getProfile(user.id);
  if (!profile || !isAdminRole(profile.role)) return null;
  return { user, profile };
}
