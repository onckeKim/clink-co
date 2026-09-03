import { NextResponse } from "next/server";
import { createClientOrNull, AUTH_UNAVAILABLE_MESSAGE } from "@/lib/supabase/safe-client";
import { signUpSchema } from "@/lib/validations/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { ensureProfile } from "@/lib/account/profiles-store";
import { linkGuestOrdersToUser } from "@/lib/orders/store";
import { siteConfig } from "@/config/site";

export async function POST(request: Request) {
  const rate = checkRateLimit(`signup:${getClientIp(request)}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = signUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details." }, { status: 400 });
  }

  const { firstName, lastName, email, password, marketingConsent } = parsed.data;
  const supabase = await createClientOrNull();
  if (!supabase) return NextResponse.json({ error: AUTH_UNAVAILABLE_MESSAGE }, { status: 503 });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { first_name: firstName, last_name: lastName, marketing_consent: marketingConsent },
      emailRedirectTo: `${siteConfig.url}/auth/confirm?type=signup`,
    },
  });

  if (error) {
    // Supabase returns a distinct error when the email is already registered.
    // That's not a sensitive fact to hide here (unlike at login) since the
    // visitor just typed this email into a signup form themselves.
    if (error.code === "user_already_exists" || error.status === 422) {
      return NextResponse.json(
        { error: "An account with that email already exists. Try logging in instead." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "We couldn't create your account. Please try again." }, { status: 500 });
  }

  const user = data.user;
  if (!user) {
    return NextResponse.json({ error: "We couldn't create your account. Please try again." }, { status: 500 });
  }

  await ensureProfile({ id: user.id, email: user.email, firstName, lastName, marketingConsent });
  const linkedOrders = await linkGuestOrdersToUser(email, user.id);

  // A session is only present here if the project has email confirmation
  // turned off; otherwise the account exists but is unconfirmed until the
  // verification link is clicked, and no session cookie is set yet.
  const needsEmailConfirmation = !data.session;

  return NextResponse.json({ needsEmailConfirmation, linkedOrders });
}
