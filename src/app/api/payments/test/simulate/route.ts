import { NextResponse } from "next/server";
import { getOrderByNumber } from "@/lib/orders/store";

/**
 * Backs the /checkout/pay/[orderNumber] simulator page. The browser never
 * needs to know the test webhook's signing secret — it just tells this
 * route which outcome to simulate, and the SERVER manufactures the signed
 * webhook call to /api/webhooks/payments/test, exactly modelling how a
 * real gateway (not the customer's browser) calls that endpoint.
 */
export async function POST(request: Request) {
  let body: { orderNumber?: string; reference?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body.orderNumber || !body.reference || !body.status) {
    return NextResponse.json({ error: "Missing orderNumber, reference or status." }, { status: 400 });
  }

  const order = getOrderByNumber(body.orderNumber);
  if (!order || order.paymentReference !== body.reference) {
    return NextResponse.json({ error: "Order or payment reference doesn't match." }, { status: 404 });
  }

  const origin = new URL(request.url).origin;
  const webhookResponse = await fetch(`${origin}/api/webhooks/payments/test`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-test-signature": process.env.TEST_PAYMENT_WEBHOOK_SECRET ?? "test-secret",
    },
    body: JSON.stringify({ orderNumber: body.orderNumber, reference: body.reference, status: body.status }),
  });

  if (!webhookResponse.ok) {
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
