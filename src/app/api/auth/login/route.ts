import { NextResponse } from "next/server";
import { createClientOrNull, AUTH_UNAVAILABLE_MESSAGE } from "@/lib/supabase/safe-client";
import { loginSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { linkGuestOrdersToUser } from "@/lib/orders/store";
import { getProfile } from "@/lib/account/profiles-store";

const GENERIC_ERROR = "Invalid email or password.";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? GENERIC_ERROR }, { status: 400 });
  }
  const { email, password } = parsed.data;

  // Rate-limit per IP *and* per email so neither a single attacker IP
  // hammering many accounts, nor a distributed attack hammering one
  // account from many IPs, gets unlimited guesses.
  const ip = getClientIp(request);
  const ipRate = checkRateLimit(`login-ip:${ip}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  const emailRate = checkRateLimit(`login-email:${email.toLowerCase()}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!ipRate.allowed || !emailRate.allowed) {
    const retryAfterSeconds = Math.max(
      ipRate.allowed ? 0 : ipRate.retryAfterSeconds,
      emailRate.allowed ? 0 : emailRate.retryAfterSeconds,
    );
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
    );
  }

  const supabase = await createClientOrNull();
  if (!supabase) return NextResponse.json({ error: AUTH_UNAVAILABLE_MESSAGE }, { status: 503 });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // Deliberately generic: don't reveal whether the account exists, whether
  // the email is unconfirmed, or which field was wrong — all of that is
  // information an attacker could use to enumerate accounts.
  if (error || !data.user) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // A disabled account (see /admin/customers) still has valid credentials —
  // signInWithPassword above already succeeded and set a session cookie —
  // so it must be explicitly signed back out here rather than just refused.
  const profile = getProfile(data.user.id);
  if (profile?.isDisabled) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "This account has been disabled. Please contact support." },
      { status: 403 },
    );
  }

  const linkedOrders = linkGuestOrdersToUser(email, data.user.id);
  return NextResponse.json({ ok: true, linkedOrders });
}
