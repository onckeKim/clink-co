import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { deleteFaq, getAdminFaqById, updateFaq } from "@/lib/admin/content-store";
import { faqPatchSchema } from "@/lib/validations/admin-content";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/content/faqs/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminFaqById(id);
  if (!before) return NextResponse.json({ error: "FAQ not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = faqPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid FAQ." }, { status: 400 });
  }

  const faq = updateFaq(id, parsed.data);
  if (!faq) return NextResponse.json({ error: "FAQ not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated FAQ",
    entityType: "content",
    entityId: faq.id,
    entityLabel: faq.question,
    before,
    after: faq,
  });

  return NextResponse.json({ faq });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/content/faqs/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminFaqById(id);
  if (!before) return NextResponse.json({ error: "FAQ not found." }, { status: 404 });

  deleteFaq(id);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Deleted FAQ",
    entityType: "content",
    entityId: before.id,
    entityLabel: before.question,
    before,
  });

  return NextResponse.json({ ok: true });
}
