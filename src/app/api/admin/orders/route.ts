import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { listAdminOrders, type AdminOrderFilters } from "@/lib/orders/store";
import type { OrderStatus, PaymentMethodId } from "@/lib/orders/types";

export async function GET(request: Request) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:view")) {
    return NextResponse.json({ error: "You don't have permission to view orders." }, { status: 403 });
  }

  const url = new URL(request.url);
  const filters: AdminOrderFilters = {
    search: url.searchParams.get("search") ?? undefined,
    status: (url.searchParams.get("status") as OrderStatus) ?? undefined,
    paymentMethod: (url.searchParams.get("paymentMethod") as PaymentMethodId) ?? undefined,
  };

  return NextResponse.json({ orders: listAdminOrders(filters) });
}
