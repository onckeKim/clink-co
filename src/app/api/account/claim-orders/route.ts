import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { linkGuestOrdersToUser } from "@/lib/orders/store";

/**
 * Links any guest orders placed with this account's verified email to the
 * signed-in user. Called automatically once per dashboard visit (see
 * DashboardView) so a "welcome back" screen can surface "we've linked N
 * previous orders" — safe to call repeatedly, since already-linked orders
 * are simply skipped.
 */
export async function POST() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  if (!user.email) return NextResponse.json({ linkedOrders: 0 });

  const linkedOrders = linkGuestOrdersToUser(user.email, user.id);
  return NextResponse.json({ linkedOrders });
}
