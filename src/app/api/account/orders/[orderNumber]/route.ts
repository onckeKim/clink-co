import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { getOrderByNumber } from "@/lib/orders/store";
import { getReturnRequest } from "@/lib/account/returns-store";

/**
 * The authenticated counterpart to /api/orders/[orderNumber] (which powers
 * the just-checked-out confirmation page and is deliberately keyed by the
 * order number alone). This route is what the account area uses instead,
 * and it enforces real ownership: a signed-in customer can only ever see
 * orders whose `userId` matches their own session, regardless of what
 * order number they guess or are given — the order number is not, by
 * itself, sufficient access here.
 */
export async function GET(_request: Request, { params }: RouteContext<"/api/account/orders/[orderNumber]">) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { orderNumber } = await params;
  const order = await getOrderByNumber(orderNumber);
  if (!order || order.userId !== user.id) {
    // Same 404 whether the order doesn't exist or belongs to someone else
    // — confirming "that order exists but isn't yours" is its own leak.
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const returnRequest = getReturnRequest(orderNumber) ?? null;
  return NextResponse.json({ order, returnRequest });
}
