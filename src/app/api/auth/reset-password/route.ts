import { NextResponse } from "next/server";
import { createClientOrNull, AUTH_UNAVAILABLE_MESSAGE } from "@/lib/supabase/safe-client";
import { resetPasswordSchema } from "@/lib/validations/auth";

/**
 * Sets a new password for the session already established by following the
 * recovery link (see /auth/confirm). Requires an authenticated session —
 * there's no separate "recovery token" passed here; Supabase's own session
 * (from verifyOtp) is what authorizes this request.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid password." }, { status: 400 });
  }

  const supabase = await createClientOrNull();
  if (!supabase) return NextResponse.json({ error: AUTH_UNAVAILABLE_MESSAGE }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "This reset link has expired. Request a new one." },
      { status: 401 },
    );
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json({ error: "We couldn't reset your password. Please try again." }, { status: 500 });
  }

  // Sign out afterwards so the recovery-link session can't be reused to
  // stay logged in — the customer proves their new password by logging in
  // fresh, on whatever device they normally use.
  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
