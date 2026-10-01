import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/dal";
import { setDefault } from "@/lib/account/addresses-store";

const bodySchema = z.object({ type: z.enum(["delivery", "billing"]) });

export async function POST(request: Request, { params }: RouteContext<"/api/account/addresses/[id]/default">) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const field = parsed.data.type === "delivery" ? "isDefaultDelivery" : "isDefaultBilling";
  const address = setDefault(user.id, id, field);
  if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  return NextResponse.json({ address });
}
