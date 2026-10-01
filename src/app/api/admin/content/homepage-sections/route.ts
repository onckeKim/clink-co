import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getHomepageSectionsConfig, updateHomepageSectionsConfig } from "@/lib/admin/content-store";
import { homepageSectionsPatchSchema } from "@/lib/validations/admin-content";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:view")) {
    return NextResponse.json({ error: "You don't have permission to view content." }, { status: 403 });
  }
  return NextResponse.json({ homepageSections: getHomepageSectionsConfig() });
}

export async function PATCH(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const before = getHomepageSectionsConfig();
  const body = await request.json().catch(() => null);
  const parsed = homepageSectionsPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid section config." }, { status: 400 });
  }

  const homepageSections = updateHomepageSectionsConfig(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated homepage section order",
    entityType: "content",
    entityId: "homepage-sections",
    entityLabel: "Homepage sections",
    before,
    after: homepageSections,
  });

  return NextResponse.json({ homepageSections });
}
