import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { updateAddress, deleteAddress } from "@/lib/account/addresses-store";
import { accountAddressSchema } from "@/lib/validations/auth";

export async function PATCH(request: Request, { params }: RouteContext<"/api/account/addresses/[id]">) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const body = await request.json().catch(() => null);
  const parsed = accountAddressSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid address." }, { status: 400 });
  }

  const address = updateAddress(user.id, id, parsed.data);
  if (!address) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  return NextResponse.json({ address });
}

export async function DELETE(_request: Request, { params }: RouteContext<"/api/account/addresses/[id]">) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  const { id } = await params;

  const deleted = deleteAddress(user.id, id);
  if (!deleted) return NextResponse.json({ error: "Address not found." }, { status: 404 });

  return NextResponse.json({ ok: true });
}
