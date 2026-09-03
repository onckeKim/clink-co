import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getAdminProductById, updateProduct, deleteProduct } from "@/lib/admin/products-store";
import { adminProductPatchSchema } from "@/lib/validations/admin-products";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/products/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "products:view")) {
    return NextResponse.json({ error: "You don't have permission to view products." }, { status: 403 });
  }

  const { id } = await params;
  const product = getAdminProductById(id);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  return NextResponse.json({ product });
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/products/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "products:write")) {
    return NextResponse.json({ error: "You don't have permission to edit products." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminProductById(id);
  if (!before) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = adminProductPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product." }, { status: 400 });
  }

  const product = updateProduct(id, parsed.data);
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated product",
    entityType: "product",
    entityId: product.id,
    entityLabel: product.name,
    before,
    after: product,
  });

  return NextResponse.json({ product });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/products/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "products:write")) {
    return NextResponse.json({ error: "You don't have permission to delete products." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminProductById(id);
  if (!before) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const result = deleteProduct(id);
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Deleted product",
    entityType: "product",
    entityId: before.id,
    entityLabel: before.name,
    before,
  });

  return NextResponse.json({ ok: true });
}
