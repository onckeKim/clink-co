import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getAdminCouponById, updateCoupon, deleteCoupon } from "@/lib/admin/coupons-store";
import { adminCouponPatchSchema } from "@/lib/validations/admin-coupons";
import { dbErrorResponse } from "@/lib/db/errors";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/coupons/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "promotions:view")) {
    return NextResponse.json({ error: "You don't have permission to view promotions." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const coupon = await getAdminCouponById(id);
    if (!coupon) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    return NextResponse.json({ coupon });
  } catch (err) {
    return dbErrorResponse(err);
  }
}

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/coupons/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "promotions:write")) {
    return NextResponse.json({ error: "You don't have permission to edit promotions." }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = adminCouponPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid coupon." }, { status: 400 });
  }

  let before, result;
  try {
    before = await getAdminCouponById(id);
    if (!before) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });
    result = await updateCoupon(id, parsed.data);
  } catch (err) {
    return dbErrorResponse(err);
  }
  if (!result.ok) return NextResponse.json({ error: result.reason }, { status: 409 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated coupon",
    entityType: "coupon",
    entityId: result.coupon.id,
    entityLabel: result.coupon.code,
    before,
    after: result.coupon,
  });

  return NextResponse.json({ coupon: result.coupon });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/admin/coupons/[id]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "promotions:write")) {
    return NextResponse.json({ error: "You don't have permission to delete promotions." }, { status: 403 });
  }

  const { id } = await params;
  try {
    const before = await getAdminCouponById(id);
    if (!before) return NextResponse.json({ error: "Coupon not found." }, { status: 404 });

    await deleteCoupon(id);

    recordAuditLog({
      userId: ctx.user.id,
      userEmail: ctx.user.email ?? "",
      action: "Deleted coupon",
      entityType: "coupon",
      entityId: before.id,
      entityLabel: before.code,
      before,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
