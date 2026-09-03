/** True once real Supabase credentials are configured — gates auth-dependent E2E flows that cannot run against this sandbox's in-memory-only setup. */
export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const SKIP_REASON =
  "Requires NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (and, for admin, an ADMIN_BOOTSTRAP_EMAILS-listed account) — not configured in this sandbox.";
