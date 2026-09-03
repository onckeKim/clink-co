import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getProfile, setProfileRole } from "@/lib/account/profiles-store";
import { setTeamRoleSchema } from "@/lib/validations/admin-team";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/team/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "team:write")) {
    return NextResponse.json({ error: "You don't have permission to manage the admin team." }, { status: 403 });
  }

  const { id } = await params;
  if (id === ctx.user.id) {
    return NextResponse.json({ error: "You can't change your own role." }, { status: 400 });
  }

  const before = getProfile(id);
  if (!before) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = setTeamRoleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid role." }, { status: 400 });
  }

  const profile = setProfileRole(id, parsed.data.role);
  if (!profile) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Changed team member role",
    entityType: "team_member",
    entityId: id,
    entityLabel: before.email ?? id,
    before: { role: before.role },
    after: { role: profile.role },
  });

  return NextResponse.json({ profile });
}
