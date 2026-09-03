import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { cancelOrder, getOrderByNumber } from "@/lib/orders/store";
import { cancelOrderSchema } from "@/lib/validations/admin-orders";
import { sendOrderCancelledEmail } from "@/lib/email";

export async function POST(request: Request, { params }: RouteContext<"/api/admin/orders/[orderNumber]/cancel">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:fulfil")) {
    return NextResponse.json({ error: "You don't have permission to cancel orders." }, { status: 403 });
  }

  const { orderNumber } = await params;
  const before = getOrderByNumber(orderNumber);
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = cancelOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const order = cancelOrder(orderNumber, parsed.data.reason);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Cancelled order",
    entityType: "order",
    entityId: order.orderNumber,
    entityLabel: order.orderNumber,
    before: { status: before.status },
    after: { status: order.status, cancelledReason: order.cancelledReason },
  });

  void sendOrderCancelledEmail(order);

  return NextResponse.json({ order });
}
