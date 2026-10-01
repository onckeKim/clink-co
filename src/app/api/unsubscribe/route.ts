import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { setMarketingConsentByEmail } from "@/lib/db/profiles";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : null;
  const token = typeof body?.token === "string" ? body.token : null;

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "This unsubscribe link is invalid or has expired." }, { status: 400 });
  }

  // No-op if there's no account for this address (a marketing email sent
  // to a non-account lead-capture address, say) — not the visitor's error.
  await setMarketingConsentByEmail(email.trim().toLowerCase(), false);
  return NextResponse.json({ ok: true });
}
