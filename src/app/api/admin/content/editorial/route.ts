import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getEditorialSection, updateEditorialSection } from "@/lib/admin/content-store";
import { editorialSectionPatchSchema } from "@/lib/validations/admin-content";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:view")) {
    return NextResponse.json({ error: "You don't have permission to view content." }, { status: 403 });
  }
  return NextResponse.json({ editorial: getEditorialSection() });
}

export async function PATCH(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const before = getEditorialSection();
  const body = await request.json().catch(() => null);
  const parsed = editorialSectionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid content." }, { status: 400 });
  }

  const editorial = updateEditorialSection(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated homepage editorial section",
    entityType: "content",
    entityId: "editorial",
    entityLabel: "Homepage editorial section",
    before,
    after: editorial,
  });

  return NextResponse.json({ editorial });
}
