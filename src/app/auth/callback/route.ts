import { NextResponse, type NextRequest } from "next/server";
import { createClientOrNull } from "@/lib/supabase/safe-client";
import { ensureProfile } from "@/lib/account/profiles-store";
import { linkGuestOrdersToUser } from "@/lib/orders/store";

/**
 * Landing point for the OAuth (PKCE) flow — used only if social login is
 * enabled (see SocialLoginButtons.tsx and NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN in
 * .env.local.example). Exchanges the `code` query param for a session; the
 * email-link flow (/auth/confirm) uses `verifyOtp` instead, since Supabase
 * issues a `token_hash`, not a `code`, for those links.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClientOrNull();
  if (!supabase) return NextResponse.redirect(`${origin}/login?error=invalid_link`);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const user = data.user;
  const meta = user.user_metadata as { first_name?: string; last_name?: string; full_name?: string; name?: string };
  const [fallbackFirst, ...fallbackRest] = (meta.full_name ?? meta.name ?? "").split(" ");
  ensureProfile({
    id: user.id,
    firstName: meta.first_name ?? fallbackFirst,
    lastName: meta.last_name ?? fallbackRest.join(" "),
  });
  if (user.email) linkGuestOrdersToUser(user.email, user.id);

  return NextResponse.redirect(`${origin}/account`);
}
