import { NextResponse } from "next/server";
import { getAvailablePaymentMethods } from "@/lib/payments";

/** Which payment methods are currently configured — env vars are the "administrator enables it" switch (see each provider file). Never expose provider credentials here, only id/label/description. */
export async function GET() {
  const methods = getAvailablePaymentMethods().map((provider) => ({
    id: provider.id,
    label: provider.label,
    description: provider.description,
  }));
  return NextResponse.json({ methods });
}
