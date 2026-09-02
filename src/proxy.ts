import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PROTECTED_PREFIX = "/account";
const AUTH_ONLY_PATHS = ["/login", "/signup"];

/**
 * Refreshes the Supabase auth session on every request so server components
 * always see a valid session, and performs *optimistic* route protection —
 * redirecting a signed-out visitor away from /account/** and a signed-in
 * one away from /login and /signup. This is a fast, cookie-based check, not
 * the last line of defense: every /account/** page and every
 * /api/account/** route independently re-verifies the session server-side
 * (see src/lib/supabase/dal.ts and each route's own `getUser()` call), per
 * Next.js's own guidance that proxy checks alone aren't sufficient —
 * https://nextjs.org/docs/app/guides/authentication#authorization.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY — see
 * .env.local.example. Safe to run even before those are configured;
 * Supabase calls (and the redirects that depend on them) are simply
 * skipped, so the site still works without auth configured.
 */
export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let response = NextResponse.next({ request });

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith(PROTECTED_PREFIX) && !user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ONLY_PATHS.includes(pathname) && user) {
    return NextResponse.redirect(new URL("/account", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
