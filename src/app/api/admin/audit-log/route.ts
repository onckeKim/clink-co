import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { listAuditLog, type AuditEntityType } from "@/lib/admin/audit-log-store";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "audit:view")) {
    return NextResponse.json({ error: "You don't have permission to view the audit log." }, { status: 403 });
  }

  const url = new URL(request.url);
  const entries = listAuditLog({
    entityType: (url.searchParams.get("entityType") as AuditEntityType) ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
    limit: 200,
  });

  return NextResponse.json({ entries });
}
