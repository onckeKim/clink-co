import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
