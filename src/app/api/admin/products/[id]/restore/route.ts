import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { restoreProduct, getAdminProductById } from "@/lib/admin/products-store";

export async function POST(_request: Request, { params }: RouteContext<"/api/admin/products/[id]/restore">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "products:write")) {
    return NextResponse.json({ error: "You don't have permission to restore products." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminProductById(id);
  if (!before) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const product = restoreProduct(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Restored product",
    entityType: "product",
    entityId: product.id,
    entityLabel: product.name,
    before: { discontinued: before.discontinued },
    after: { discontinued: product.discontinued },
  });

  return NextResponse.json({ product });
}
