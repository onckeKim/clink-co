import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/orders/store";

/**
 * Powers the order confirmation page. The order number itself is the
 * access control here — standard for a guest-checkout confirmation
 * reached immediately via redirect. A returning-later "view my order"
 * flow (e.g. from an email link after the session has ended) would want
 * a signed token or an email-match check layered on top of this; that's
 * a natural extension once accounts/auth exist.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }
  return NextResponse.json({ order });
}
