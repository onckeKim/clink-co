import { NextResponse } from "next/server";
import { createClientOrNull } from "@/lib/supabase/safe-client";
import { forgotPasswordSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { siteConfig } from "@/config/site";

// Always the same message, sent for both valid and invalid emails — the
// one place in this flow where leaking "that email doesn't exist" would
// hand an attacker a working account-enumeration oracle.
const GENERIC_MESSAGE = "If an account exists for that email, we've sent a password reset link.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter a valid email." }, { status: 400 });
  }
  const { email } = parsed.data;

  // Tightly rate-limited per email *and* per IP — this endpoint sends an
  // email per request, so it's the easiest one in this file to turn into a
  // spam vector against a real inbox, or a mass-mailer, if left uncapped.
  const emailRate = checkRateLimit(`forgot-password-email:${email.toLowerCase()}`, {
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });
  const ipRate = checkRateLimit(`forgot-password-ip:${getClientIp(request)}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!emailRate.allowed || !ipRate.allowed) {
    // Still return the generic success message — a 429 here would itself
    // leak "this email exists and you've already requested a reset".
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }

  const supabase = await createClientOrNull();
  // Same generic message either way — whether the email doesn't exist or
  // Supabase isn't configured, the requester can't (and shouldn't be able
  // to) tell the difference.
  if (supabase) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteConfig.url}/auth/confirm?type=recovery`,
    });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}
