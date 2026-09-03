import { NextResponse } from "next/server";
import { getAdminContext } from "@/lib/supabase/dal";
import { hasPermission } from "@/lib/admin/roles";
import { addOrderNote, listOrderNotes } from "@/lib/admin/order-notes-store";
import { getOrderByNumber } from "@/lib/orders/store";
import { orderNoteSchema } from "@/lib/validations/admin-orders";

export async function GET(_request: Request, { params }: RouteContext<"/api/admin/orders/[orderNumber]/notes">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:view")) {
    return NextResponse.json({ error: "You don't have permission to view orders." }, { status: 403 });
  }

  const { orderNumber } = await params;
  return NextResponse.json({ notes: listOrderNotes(orderNumber) });
}

export async function POST(request: Request, { params }: RouteContext<"/api/admin/orders/[orderNumber]/notes">) {
  const ctx = await getAdminContext();
  if (!ctx) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!hasPermission(ctx.profile.role, "orders:view")) {
    return NextResponse.json({ error: "You don't have permission to add order notes." }, { status: 403 });
  }

  const { orderNumber } = await params;
  const order = getOrderByNumber(orderNumber);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const body = await request.json().catch(() => null);
  const parsed = orderNoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid note." }, { status: 400 });
  }

  const note = addOrderNote({
    orderNumber,
    authorId: ctx.user.id,
    authorEmail: ctx.user.email ?? "",
    note: parsed.data.note,
  });

  return NextResponse.json({ note }, { status: 201 });
}
