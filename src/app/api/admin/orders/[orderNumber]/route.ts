import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { getOrderByNumber } from "@/lib/orders/store";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/orders/[orderNumber]">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:view")) {
    return NextResponse.json({ error: "You don't have permission to view orders." }, { status: 403 });
  }

  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  return NextResponse.json({ order });
}
