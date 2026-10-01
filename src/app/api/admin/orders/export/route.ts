import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { recordAuditLog } from "@/lib/admin/audit-log-store";
import { listAdminOrders, type AdminOrderFilters } from "@/lib/orders/store";
import { ordersToCsv } from "@/lib/orders/csv-export";
import type { OrderStatus, PaymentMethodId } from "@/lib/orders/types";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:export")) {
    return NextResponse.json({ error: "You don't have permission to export orders." }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters: AdminOrderFilters = {
    search: url.searchParams.get("search") ?? undefined,
    status: (url.searchParams.get("status") as OrderStatus) ?? undefined,
    paymentMethod: (url.searchParams.get("paymentMethod") as PaymentMethodId) ?? undefined,
  };
  const orders = await listAdminOrders(filters);

  recordAuditLog({
    userId: ctx.user.id,
    userEmail: ctx.user.email ?? "",
    action: "Exported orders to CSV",
    entityType: "order",
    entityId: "export",
    entityLabel: `${orders.length} order(s)`,
  });

  return new NextResponse(ordersToCsv(orders), {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
