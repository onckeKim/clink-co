import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getAdminCustomerById } from "@/lib/admin/customers-store";
import { updateProfile } from "@/lib/account/profiles-store";
import { adminCustomerPatchSchema } from "@/lib/validations/admin-customers";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/customers/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "customers:view")) {
    return NextResponse.json({ error: "You don't have permission to view customers." }, { status: 403 });
  }

  const { id } = await params;
  const customer = await getAdminCustomerById(id);
  if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  return NextResponse.json({ customer });
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/customers/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "customers:write")) {
    return NextResponse.json({ error: "You don't have permission to edit customers." }, { status: 403 });
  }

  const { id } = await params;
  const before = await getAdminCustomerById(id);
  if (!before) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = adminCustomerPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  await updateProfile(id, parsed.data);
  const customer = await getAdminCustomerById(id);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated customer marketing consent",
    entityType: "customer",
    entityId: id,
    entityLabel: before.email ?? id,
    before: { marketingConsent: before.marketingConsent },
    after: { marketingConsent: customer?.marketingConsent },
  });

  return NextResponse.json({ customer });
}
