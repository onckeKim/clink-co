import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getAdminCustomerById } from "@/lib/admin/customers-store";
import { setProfileDisabled } from "@/lib/account/profiles-store";
import { disableCustomerSchema } from "@/lib/validations/admin-customers";

export async function POST(request: Request, { params }: RouteContext<"/api/admin/customers/[id]/disable">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "customers:write")) {
    return NextResponse.json({ error: "You don't have permission to disable customer accounts." }, { status: 403 });
  }

  const { id } = await params;
  const before = getAdminCustomerById(id);
  if (!before) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = disableCustomerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }
  if (parsed.data.isDisabled && !parsed.data.reason) {
    return NextResponse.json({ error: "A reason is required to disable an account." }, { status: 400 });
  }

  const profile = setProfileDisabled(id, parsed.data.isDisabled, parsed.data.reason);
  if (!profile) return NextResponse.json({ error: "Customer not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: profile.isDisabled ? "Disabled customer account" : "Re-enabled customer account",
    entityType: "customer",
    entityId: id,
    entityLabel: before.email ?? id,
    before: { isDisabled: before.isDisabled, disabledReason: before.disabledReason },
    after: { isDisabled: profile.isDisabled, disabledReason: profile.disabledReason },
  });

  return NextResponse.json({ customer: getAdminCustomerById(id) });
}
