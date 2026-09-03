import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { getOrdersByUserId } from "@/lib/orders/store";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  return NextResponse.json({ orders: await getOrdersByUserId(user.id) });
}
