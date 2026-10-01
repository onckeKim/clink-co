import { test as base, expect } from "@playwright/test";

/**
 * Every spec in this suite should import { test, expect } from here instead
 * of directly from "@playwright/test" — this pre-seeds the cookie-consent
 * choice (as if a returning visitor had already decided) before any page
 * script runs, so the fixed, bottom-anchored consent banner
 * (src/components/layout/CookieBanner.tsx) never appears and can't
 * intercept clicks on whatever's underneath it — which it otherwise does
 * on a narrow/mobile viewport, since it stays visible until dismissed.
 * Tests that specifically exercise the banner itself (first-visit
 * behavior, accept/reject) are the one case that should still import
 * directly from "@playwright/test" instead of this file.
 */
export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "clink-co-cookie-consent",
        JSON.stringify({ state: { analytics: false, marketing: false, hasDecided: true }, version: 0 }),
      );
    });
    await runTest(page);
  },
});

export { expect };
