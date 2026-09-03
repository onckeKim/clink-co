import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { getOrderByNumber, recordOrderRefund } from "@/lib/orders/store";
import { refundOrderSchema } from "@/lib/validations/admin-orders";
import { sendRefundProcessedEmail } from "@/lib/email";

export async function POST(request: Request, { params }: RouteContext<"/api/admin/orders/[orderNumber]/refund">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:fulfil")) {
    return NextResponse.json({ error: "You don't have permission to record refunds." }, { status: 403 });
  }

  const { orderNumber } = await params;
  const before = getOrderByNumber(orderNumber);
  if (!before) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = refundOrderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid refund." }, { status: 400 });
  }
  if (parsed.data.amount > before.total) {
    return NextResponse.json({ error: "Refund amount can't exceed the order total." }, { status: 400 });
  }

  const order = recordOrderRefund(orderNumber, parsed.data);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Recorded refund",
    entityType: "order",
    entityId: order.orderNumber,
    entityLabel: order.orderNumber,
    before: { refundAmount: before.refundAmount },
    after: { refundAmount: order.refundAmount, refundReason: order.refundReason },
  });

  void sendRefundProcessedEmail(order);

  return NextResponse.json({ order });
}
