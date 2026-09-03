import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { createProduct, listAdminProducts, type AdminProductFilters } from "@/lib/admin/products-store";
import { adminProductSchema } from "@/lib/validations/admin-products";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "products:view")) {
    return NextResponse.json({ error: "You don't have permission to view products." }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters: AdminProductFilters = {
    search: url.searchParams.get("search") ?? undefined,
    categorySlug: url.searchParams.get("categorySlug") ?? undefined,
    publishStatus: (url.searchParams.get("publishStatus") as AdminProductFilters["publishStatus"]) ?? undefined,
    stockLevel: (url.searchParams.get("stockLevel") as AdminProductFilters["stockLevel"]) ?? undefined,
  };

  return NextResponse.json({ products: listAdminProducts(filters) });
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "products:write")) {
    return NextResponse.json({ error: "You don't have permission to create products." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminProductSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid product." }, { status: 400 });
  }

  const product = createProduct(parsed.data);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Created product",
    entityType: "product",
    entityId: product.id,
    entityLabel: product.name,
    after: product,
  });

  return NextResponse.json({ product }, { status: 201 });
}
