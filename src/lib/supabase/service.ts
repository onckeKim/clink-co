import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role Supabase client — bypasses Row Level Security entirely.
 * Never import this into anything that can run in the browser; it exists
 * only for the specific server-side operations this schema's RLS
 * deliberately reserves for it (see supabase/README.md's security
 * decisions): creating an order with a server-computed total, writing a
 * payment record, redeeming a discount code, and the few other places a
 * migration comment says "service-role only". Requires
 * SUPABASE_SERVICE_ROLE_KEY — see .env.local.example. Returns `null`
 * instead of throwing when that isn't set, same pattern as
 * createClientOrNull() in ./safe-client.ts, so a route handler can
 * degrade to a clean error response instead of crashing.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;

  return createSupabaseClient<Database>(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
