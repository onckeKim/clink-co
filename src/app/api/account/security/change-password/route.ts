import { NextResponse } from "next/server";
import { createClientOrNull, AUTH_UNAVAILABLE_MESSAGE } from "@/lib/supabase/safe-client";
import { changePasswordSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const supabase = await createClientOrNull();
  if (!supabase) return NextResponse.json({ error: AUTH_UNAVAILABLE_MESSAGE }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const rate = checkRateLimit(`change-password:${getClientIp(request)}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid password." }, { status: 400 });
  }

  // Re-authenticate with the current password before allowing the change —
  // an active session alone (e.g. a device left logged in) shouldn't be
  // enough to take over the account's credentials.
  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (reauthError) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 401 });
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
  if (error) {
    return NextResponse.json({ error: "We couldn't update your password. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
