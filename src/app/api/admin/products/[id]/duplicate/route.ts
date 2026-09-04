import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { duplicateProduct } from "@/lib/admin/products-store";
import { dbErrorResponse } from "@/lib/db/errors";

export async function POST(_request: Request, { params }: RouteContext<"/api/admin/products/[id]/duplicate">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "products:write")) {
    return NextResponse.json({ error: "You don't have permission to duplicate products." }, { status: 403 });
  }

  const { id } = await params;
  let product;
  try {
    product = await duplicateProduct(id);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  } catch (err) {
    return dbErrorResponse(err);
  }

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Duplicated product",
    entityType: "product",
    entityId: product.id,
    entityLabel: product.name,
    after: product,
  });

  return NextResponse.json({ product }, { status: 201 });
}
