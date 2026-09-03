import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { DatabaseUnavailableError, unwrap } from "./errors";
import type { Database, Json } from "@/lib/supabase/types";

type AuditEntry = Database["public"]["Tables"]["admin_audit_logs"]["Row"];

/**
 * Records one admin_audit_logs row via the log_admin_action() RPC
 * (0009_audit_log.sql) — never a direct `.from("admin_audit_logs").insert()`,
 * since there is no INSERT policy for anon/authenticated on that table at
 * all. The RPC itself fills in `user_id`/`user_email` from the session
 * making the call, so this must run with the service-role client acting
 * *on behalf of* the admin whose action this is — in a real deployment
 * that means calling it from the same Route Handler that already has that
 * admin's session, immediately after (or as part of) the mutation itself.
 * This is the direct Supabase-backed replacement for
 * src/lib/admin/audit-log-store.ts's recordAuditLog(); every admin API
 * route that calls that today calls this instead once the swap-over
 * happens — same call sites, same shape.
 */
export async function recordAuditLog(input: {
  action: string;
  entityType: string;
  entityId: string;
  entityLabel: string;
  before?: Json | null;
  after?: Json | null;
}): Promise<AuditEntry> {
  const db = createServiceClient();
  if (!db) throw new DatabaseUnavailableError();

  const { data, error } = await db.rpc("log_admin_action", {
    p_action: input.action,
    p_entity_type: input.entityType,
    p_entity_id: input.entityId,
    p_entity_label: input.entityLabel,
    p_before: input.before ?? null,
    p_after: input.after ?? null,
  });
  return unwrap({ data, error });
}
