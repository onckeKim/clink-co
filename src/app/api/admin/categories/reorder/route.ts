import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { reorderCategories } from "@/lib/admin/categories-store";
import { reorderCategoriesSchema } from "@/lib/validations/admin-categories";

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "categories:write")) {
    return NextResponse.json({ error: "You don't have permission to reorder categories." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = reorderCategoriesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid order." }, { status: 400 });
  }

  const categories = reorderCategories(parsed.data.orderedIds);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Reordered categories",
    entityType: "category",
    entityId: "all",
    entityLabel: "Category display order",
    after: parsed.data.orderedIds,
  });

  return NextResponse.json({ categories });
}
