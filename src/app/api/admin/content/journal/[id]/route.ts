import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { deleteArticle, getAdminArticleById, updateArticle } from "@/lib/admin/content-store";
import { articlePatchSchema } from "@/lib/validations/admin-content";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/content/journal/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminArticleById(id);
  if (!before) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = articlePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid article." }, { status: 400 });
  }

  const article = updateArticle(id, parsed.data);
  if (!article) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated journal article",
    entityType: "content",
    entityId: article.id,
    entityLabel: article.title,
    before,
    after: article,
  });

  return NextResponse.json({ article });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/content/journal/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "content:write")) {
    return NextResponse.json({ error: "You don't have permission to edit content." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminArticleById(id);
  if (!before) return NextResponse.json({ error: "Article not found." }, { status: 404 });

  deleteArticle(id);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Deleted journal article",
    entityType: "content",
    entityId: before.id,
    entityLabel: before.title,
    before,
  });

  return NextResponse.json({ ok: true });
}
