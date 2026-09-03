"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * /admin is a separate internal tool with its own full-page shell
 * (AdminShell: sidebar nav, topbar, logout — see src/app/admin/layout.tsx)
 * that isn't meant to sit inside the storefront's own fixed Header/Footer.
 * Next.js only supports one root layout without a large route-group
 * restructuring of every existing storefront route, so this client
 * component makes the same call at render time instead: skip the
 * storefront chrome (and its fixed-header top padding) for /admin, keep it
 * everywhere else — including /account, which is customer-facing and does
 * want the normal site chrome around it.
 */
export function SiteChrome({
  skipLink,
  header,
  banners,
  footer,
  cookieBanner,
  authCartSync,
  children,
}: {
  skipLink: ReactNode;
  header: ReactNode;
  /** Rendered as the first thing inside the (already header-offset) content area, not above the fixed Header itself — the Header's fixed height (and the `-mt-24` hero pages compensate it with) stays constant regardless of whether a banner is active. */
  banners: ReactNode;
  footer: ReactNode;
  cookieBanner: ReactNode;
  authCartSync: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {skipLink}
      {header}
      {/*
        Sits between the fixed Header and `main` in normal flow, offset by
        its own mt-24 to clear the header — deliberately NOT inside `main`.
        `main`'s own pt-24 (and the negative -mt-24 Hero.tsx cancels it
        with on the homepage) has to keep assuming "no banner" so that
        math stays correct whether or not one is active; putting the
        banner here means it never touches that calculation. The one
        trade-off: a non-hero page gets a bit of extra whitespace above
        its content while a banner is active, since `main`'s pt-24 still
        applies on top of the banner's own height — an acceptable cost
        next to the alternative of a banner ever overlapping the header.
      */}
      {banners && <div className="mt-24 print:hidden">{banners}</div>}
      <main id="main-content" className="flex-1 pt-24 print:pt-0">
        {children}
      </main>
      {footer}
      {cookieBanner}
      {authCartSync}
    </>
  );
}
