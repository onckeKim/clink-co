import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getOrderByNumber, setOrderTracking } from "@/lib/orders/store";
import { orderTrackingSchema } from "@/lib/validations/admin-orders";
import { sendOrderShippedEmail } from "@/lib/email";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/orders/[orderNumber]/tracking">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:fulfil")) {
    return NextResponse.json({ error: "You don't have permission to add tracking information." }, { status: 403 });
  }

  const { orderNumber } = await params;
  const before = await getOrderByNumber(orderNumber);
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = orderTrackingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid tracking information." }, { status: 400 });
  }

  const order = await setOrderTracking(orderNumber, parsed.data);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Added tracking information",
    entityType: "order",
    entityId: order.orderNumber,
    entityLabel: order.orderNumber,
    before: {
      trackingCarrier: before.trackingCarrier,
      trackingNumber: before.trackingNumber,
      trackingUrl: before.trackingUrl,
    },
    after: parsed.data,
  });

  // Adding tracking is the natural "this order has shipped" moment.
  void sendOrderShippedEmail(order);

  return NextResponse.json({ order });
}
