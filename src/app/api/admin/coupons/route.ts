import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { createCoupon, listAdminCoupons } from "@/lib/admin/coupons-store";
import { adminCouponSchema } from "@/lib/validations/admin-coupons";
import { dbErrorResponse } from "@/lib/db/errors";

export async function GET() {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "promotions:view")) {
    return NextResponse.json({ error: "You don't have permission to view promotions." }, { status: 403 });
  }

  try {
    return NextResponse.json({ coupons: await listAdminCoupons() });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function POST(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "promotions:write")) {
    return NextResponse.json({ error: "You don't have permission to create promotions." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = adminCouponSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon." }, { status: 400 });
  }

  let result;
  try {
    result = await createCoupon(parsed.data);
  } catch (err) {
    return dbErrorResponse(err);
  }
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Created coupon",
    entityType: "coupon",
    entityId: result.coupon.id,
    entityLabel: result.coupon.code,
    after: result.coupon,
  });

  return NextResponse.json({ coupon: result.coupon }, { status: 201 });
}
