import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/account/profiles-store";

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
 * Role-based access — reserved for a future admin area (no admin UI exists
 * yet in this build). `profiles.role` defaults to "customer" for every
 * shopper; nothing sets "admin" today, so this always redirects until an
 * admin surface consumes it. Wired now so that surface doesn't need to
 * retrofit authorization later.
 */
export async function requireRole(role: "admin", redirectTo = "/account"): Promise<User> {
  const user = await requireUser();
  const profile = getProfile(user.id);
  if (profile?.role !== role) redirect(redirectTo);
  return user;
}
