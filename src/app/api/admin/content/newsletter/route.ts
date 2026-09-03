import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getNewsletterContent, updateNewsletterContent } from "@/lib/admin/content-store";
import { newsletterContentPatchSchema } from "@/lib/validations/admin-content";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:view")) {
    return NextResponse.json({ error: "You don't have permission to view content." }, { status: 403 });
  }
  return NextResponse.json({ newsletter: getNewsletterContent() });
}

export async function PATCH(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const before = getNewsletterContent();
  const body = await request.json().catch(() => null);
  const parsed = newsletterContentPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid content." }, { status: 400 });
  }

  const newsletter = updateNewsletterContent(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated newsletter copy",
    entityType: "content",
    entityId: "newsletter",
    entityLabel: "Newsletter section copy",
    before,
    after: newsletter,
  });

  return NextResponse.json({ newsletter });
}
