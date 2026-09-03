import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { createCategory, listAdminCategories } from "@/lib/admin/categories-store";
import { adminCategorySchema } from "@/lib/validations/admin-categories";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "categories:view")) {
    return NextResponse.json({ error: "You don't have permission to view categories." }, { status: 403 });
  }

  return NextResponse.json({ categories: listAdminCategories() });
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "categories:write")) {
    return NextResponse.json({ error: "You don't have permission to create categories." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid category." }, { status: 400 });
  }

  const category = createCategory(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Created category",
    entityType: "category",
    entityId: category.id,
    entityLabel: category.name,
    after: category,
  });

  return NextResponse.json({ category }, { status: 201 });
}
