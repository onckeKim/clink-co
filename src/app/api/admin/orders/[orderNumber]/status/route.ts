import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getOrderByNumber, setOrderStatus } from "@/lib/orders/store";
import { orderStatusSchema } from "@/lib/validations/admin-orders";

export async function PATCH(request: Request, { params }: RouteContext<"/api/admin/orders/[orderNumber]/status">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:fulfil")) {
    return NextResponse.json({ error: "You don't have permission to update order status." }, { status: 403 });
  }

  const { orderNumber } = await params;
  const before = getOrderByNumber(orderNumber);
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = orderStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid status." }, { status: 400 });
  }

  const order = setOrderStatus(orderNumber, parsed.data.status);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Updated order status",
    entityType: "order",
    entityId: order.orderNumber,
    entityLabel: order.orderNumber,
    before: { status: before.status },
    after: { status: order.status },
  });

  return NextResponse.json({ order });
}
