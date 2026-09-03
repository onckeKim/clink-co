import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getAdminCategoryById, updateCategory, deleteCategory } from "@/lib/admin/categories-store";
import { adminCategoryPatchSchema } from "@/lib/validations/admin-categories";
import { dbErrorResponse } from "@/lib/db/errors";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/categories/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "categories:view")) {
    return NextResponse.json({ error: "You don't have permission to view categories." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const category = await getAdminCategoryById(id);
    if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });
    return NextResponse.json({ category });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/categories/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "categories:write")) {
    return NextResponse.json({ error: "You don't have permission to edit categories." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminCategoryPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid category." }, { status: 400 });
  }

  try {
    const before = await getAdminCategoryById(id);
    if (!before) return NextResponse.json({ error: "Category not found." }, { status: 404 });

    const category = await updateCategory(id, parsed.data);

    recordAuditLog({
      userId: ctx.user.id,
      userEmail: ctx.user.email ?? "",
      action: "Updated category",
      entityType: "category",
      entityId: category.id,
      entityLabel: category.name,
      before,
      after: category,
    });

    return NextResponse.json({ category });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/categories/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "categories:write")) {
    return NextResponse.json({ error: "You don't have permission to delete categories." }, { status: 403 });
  }

  const { id } = await params;
  const before = await getAdminCategoryById(id);
  if (!before) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  let result;
  try {
    result = await deleteCategory(id);
  } catch (err) {
    return dbErrorResponse(err);
  }
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Deleted category",
    entityType: "category",
    entityId: before.id,
    entityLabel: before.name,
    before,
  });

  return NextResponse.json({ ok: true });
}
