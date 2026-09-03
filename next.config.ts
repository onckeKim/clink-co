import type { NextConfig } from "next";

/**
 * Content-Security-Policy for the whole app. `script-src` has to keep
 * 'unsafe-inline' — Next.js's own hydration/RSC payload scripts and the
 * inline loader snippets each analytics provider ships (Clarity, Meta
 * Pixel, TikTok Pixel — see src/components/analytics/Analytics.tsx) both
 * rely on it, and none of those inline scripts carry a nonce today. A
 * stricter nonce-based CSP is possible (Next.js supports it via
 * middleware) but is a larger, separately-tested change — see the
 * deployment docs for that upgrade path. Everything else here is as
 * tight as the app's actual third-party footprint allows.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.clarity.ms https://connect.facebook.net https://analytics.tiktok.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co https://www.google-analytics.com https://www.clarity.ms https://connect.facebook.net https://analytics.tiktok.com",
  "frame-src 'self' https://www.facebook.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  // Vercel already terminates TLS and adds HSTS for custom domains, but
  // setting it explicitly keeps behavior identical on any other host.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // lucide-react is optimized by Next's default list already; framer-motion
    // isn't, and it's the heaviest non-default dependency in the bundle
    // (used by Modal, SearchModal, MobileDrawer, CookieBanner, Carousel,
    // Reveal — see `grep -rl framer-motion src`), so only-load-what's-used
    // tree-shaking there is worth the explicit opt-in.
    optimizePackageImports: ["framer-motion"],
  },
  async headers() {
    return [
      {
        // Applies to every route, including API routes — the CSP mainly
        // protects HTML responses, but the other headers are harmless
        // (and correct) on JSON responses too.
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
      {
        // The manifest icon routes (src/app/icons/*/route.tsx) render a
        // static brand mark with no per-request data — safe to cache
        // aggressively at the edge/browser instead of regenerating the PNG.
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  images: {
    // The seed data currently ships local SVG placeholders under
    // /public/images (see scripts/generate-placeholders.mjs). SVG support
    // has to be opted into explicitly. Once real product photography is
    // hosted (e.g. Supabase Storage), add its hostname to `remotePatterns`
    // below and this flag can be removed.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      // Example for when real photography moves to Supabase Storage:
      // {
      //   protocol: "https",
      //   hostname: "<project-ref>.supabase.co",
      //   pathname: "/storage/v1/object/public/**",
      // },
    ],
  },
};

export default nextConfig;
