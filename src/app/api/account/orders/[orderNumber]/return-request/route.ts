import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { getOrderByNumber } from "@/lib/orders/store";
import { createReturnRequest, getReturnRequest } from "@/lib/account/returns-store";
import { returnRequestSchema } from "@/lib/validations/auth";
import { sendReturnRequestReceivedEmail, sendReturnRequestAdminNotification } from "@/lib/email";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/account/orders/[orderNumber]/return-request">,
) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order || order.userId !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (order.status !== "paid" && order.status !== "fulfilled") {
    return NextResponse.json(
      { error: "Only paid orders can be returned." },
      { status: 409 },
    );
  }

  if (getReturnRequest(orderNumber)) {
    return NextResponse.json({ error: "A return has already been requested for this order." }, { status: 409 });
  }

  const body = await request.json().catch(() => null);
  const parsed = returnRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
  }

  const returnRequest = createReturnRequest({
    orderNumber,
    userId: user.id,
    reason: parsed.data.reason,
    notes: parsed.data.notes,
    evidenceImages: parsed.data.evidenceImages,
  });

  void sendReturnRequestReceivedEmail(order, parsed.data.reason, parsed.data.notes);
  void sendReturnRequestAdminNotification(order, parsed.data.reason, parsed.data.notes);

  return NextResponse.json({ returnRequest }, { status: 201 });
}
