import "server-only";
import { createClientOrNull } from "@/lib/supabase/safe-client";
import { DatabaseUnavailableError } from "./errors";

/**
 * The session-aware (RLS-enforced) server client every src/lib/db/**
 * function reads and writes through by default. Throws
 * DatabaseUnavailableError instead of a raw exception when Supabase env
 * vars aren't configured, so a Route Handler that calls this can let the
 * error propagate to its own try/catch → dbErrorResponse() without a
 * special case — see src/lib/supabase/safe-client.ts for why this can be
 * null in the first place.
 */
export async function getDb() {
  const client = await createClientOrNull();
  if (!client) throw new DatabaseUnavailableError();
  return client;
}
