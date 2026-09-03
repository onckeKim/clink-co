"use client";

import dynamic from "next/dynamic";

/**
 * `next/dynamic`'s `ssr: false` option is only valid from a Client
 * Component — this thin wrapper is that boundary so the root layout
 * (a Server Component) can still defer CookieBanner's framer-motion-heavy
 * bundle out of the initial page load.
 */
export const CookieBannerLoader = dynamic(() => import("./CookieBanner").then((m) => m.CookieBanner), {
  ssr: false,
});
