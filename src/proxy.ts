import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isMaintenanceModeOn } from "@/lib/admin/settings-store";

const PROTECTED_PREFIXES = ["/account", "/admin"];
const AUTH_ONLY_PATHS = ["/login", "/signup"];
/** Always reachable even while maintenance mode is on — store staff need /login and /admin to turn it back off, and the maintenance page itself must not redirect to itself. */
const MAINTENANCE_MODE_EXEMPT_PREFIXES = ["/admin", "/api/admin", "/api/auth", "/login", "/maintenance"];

/**
 * Refreshes the Supabase auth session on every request so server components
 * always see a valid session, and performs *optimistic* route protection —
 * redirecting a signed-out visitor away from /account/** and /admin/**, and
 * a signed-in one away from /login and /signup. This is a fast, cookie-based
 * check, not the last line of defense.
 *
 * Deliberately does NOT check the /admin role here, even though — as of
 * Next.js 16, proxy defaults to the Node.js runtime (see
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md#runtime)
 * and so *can* now reliably share in-memory module state (like the store
 * settings check below) with the rest of the server process, unlike the
 * old Edge runtime this project's comments used to assume. The role check
 * still stays server-component-side in src/app/admin/layout.tsx via
 * requireAdmin() rather than moving here, per Next.js's own guidance that
 * proxy checks alone aren't sufficient defense —
 * https://nextjs.org/docs/app/guides/authentication#authorization — and to
 * keep exactly one place owning that authorization decision.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY — see
 * .env.local.example. Safe to run even before those are configured;
 * Supabase calls (and the redirects that depend on them) are simply
 * skipped, so the site still works without auth configured.
 */
export async function proxy(request: NextRequest) {
  const { pathname: maintenancePathname } = request.nextUrl;
  if (
    isMaintenanceModeOn() &&
    !MAINTENANCE_MODE_EXEMPT_PREFIXES.some((prefix) => maintenancePathname.startsWith(prefix))
  ) {
    return NextResponse.rewrite(new URL("/maintenance", request.url));
  }

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

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !user) {
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
