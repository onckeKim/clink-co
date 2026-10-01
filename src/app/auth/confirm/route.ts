import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClientOrNull } from "@/lib/supabase/safe-client";
import { ensureProfile } from "@/lib/account/profiles-store";
import { linkGuestOrdersToUser } from "@/lib/orders/store";

const KNOWN_TYPES: EmailOtpType[] = ["signup", "recovery", "email", "email_change", "invite", "magiclink"];

/**
 * Landing point for Supabase's emailed verification links (sign-up
 * confirmation and password recovery) when the project's email templates
 * are customized to point here — see the README's auth setup section. Uses
 * `verifyOtp` (a `token_hash` + `type` pair) rather than the PKCE `code`
 * exchange used by /auth/callback, matching the OTP-link shape Supabase's
 * default email templates produce.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (!tokenHash || !type || !KNOWN_TYPES.includes(type)) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const supabase = await createClientOrNull();
  if (!supabase) return NextResponse.redirect(`${origin}/login?error=invalid_link`);

  const { data, error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/login?error=invalid_link`);
  }

  const user = data.user;
  const meta = user.user_metadata as { first_name?: string; last_name?: string };
  await ensureProfile({ id: user.id, email: user.email, firstName: meta.first_name, lastName: meta.last_name });
  if (user.email) await linkGuestOrdersToUser(user.email, user.id);

  if (type === "recovery") {
    return NextResponse.redirect(`${origin}/reset-password`);
  }
  return NextResponse.redirect(`${origin}/account?welcome=1`);
}
