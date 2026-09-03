import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";
import { listProfiles, updateProfile } from "@/lib/account/profiles-store";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email : null;
  const token = typeof body?.token === "string" ? body.token : null;

  if (!email || !token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.json({ error: "This unsubscribe link is invalid or has expired." }, { status: 400 });
  }

  const profile = listProfiles().find((p) => p.email?.toLowerCase() === email.trim().toLowerCase());
  if (!profile) {
    // No account for this address — nothing to flip, but this isn't the
    // customer's error, and a marketing email sent to a non-account
    // address (a lead capture, say) has nothing further to do here.
    return NextResponse.json({ ok: true });
  }

  updateProfile(profile.id, { marketingConsent: false });
  return NextResponse.json({ ok: true });
}
