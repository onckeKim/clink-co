import { createClient } from "@/lib/supabase/server";

/**
 * Same server client as `createClient()`, but returns `null` instead of
 * throwing when Supabase env vars aren't set — used by route handlers that
 * call Supabase directly (sign-up, login, logout, password reset) so a
 * misconfigured environment returns a clean JSON error instead of an
 * unhandled 500. `src/lib/supabase/dal.ts`'s `getUser()` does the same for
 * everything that goes through the DAL.
 */
export async function createClientOrNull() {
  try {
    return await createClient();
  } catch {
    return null;
  }
}

export const AUTH_UNAVAILABLE_MESSAGE = "Sign-in isn't available right now. Please try again later.";
