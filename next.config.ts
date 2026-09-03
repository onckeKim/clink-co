import type { NextConfig } from "next";

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
