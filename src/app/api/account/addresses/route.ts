import { NextResponse } from "next/server";
import { getUser } from "@/lib/supabase/dal";
import { listAddresses, createAddress } from "@/lib/account/addresses-store";
import { accountAddressSchema } from "@/lib/validations/auth";

export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  return NextResponse.json({ addresses: listAddresses(user.id) });
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = accountAddressSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid address." }, { status: 400 });
  }

  const address = createAddress(user.id, {
    label: parsed.data.label ?? null,
    fullName: parsed.data.fullName,
    line1: parsed.data.line1,
    line2: parsed.data.line2 ?? null,
    suburb: parsed.data.suburb,
    city: parsed.data.city,
    province: parsed.data.province,
    postalCode: parsed.data.postalCode,
    phone: parsed.data.phone,
    isDefaultDelivery: parsed.data.isDefaultDelivery,
    isDefaultBilling: parsed.data.isDefaultBilling,
  });

  return NextResponse.json({ address }, { status: 201 });
}
