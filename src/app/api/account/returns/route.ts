import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { listReturnRequestsForUser } from "@/lib/account/returns-store";

/** Backs the "return status tracking" section of the public /returns page. */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  return NextResponse.json({ returnRequests: listReturnRequestsForUser(user.id) });
}
