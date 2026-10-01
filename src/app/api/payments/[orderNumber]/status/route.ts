import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/orders/store";

/**
 * Lets the client re-check an order's payment status against the server's
 * own record rather than trusting query params on a gateway redirect
 * (which a customer could edit in the address bar) — used by the
 * confirmation page and the test-payment simulator.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/payments/[orderNumber]/status">) {
  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    total: order.total,
  });
}
