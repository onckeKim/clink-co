import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { archiveProduct, getAdminProductById } from "@/lib/admin/products-store";
import { dbErrorResponse } from "@/lib/db/errors";

export async function POST(_request: Request, { params }: RouteContext<"/api/admin/products/[id]/archive">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "products:write")) {
    return NextResponse.json({ error: "You don't have permission to archive products." }, { status: 403 });
  }

  const { id } = await params;
  let before, product;
  try {
    before = await getAdminProductById(id);
    if (!before) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    product = await archiveProduct(id);
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  } catch (err) {
    return dbErrorResponse(err);
  }

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Archived product",
    entityType: "product",
    entityId: product.id,
    entityLabel: product.name,
    before: { discontinued: before.discontinued },
    after: { discontinued: product.discontinued },
  });

  return NextResponse.json({ product });
}
