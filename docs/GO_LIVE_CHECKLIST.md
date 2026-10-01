# Go-live checklist

Work through this after **[DEPLOYMENT.md](./DEPLOYMENT.md)** is done (site
deployed, domain live, credentials in place) and before announcing the
store is open. Items are grouped the way a real launch review would check
them, not in the order they appear in any one file.

> Read **[DEPLOYMENT.md's "Known limitation" section](./DEPLOYMENT.md#known-limitation-the-commerce-data-isnt-in-supabase-yet)**
> before working through the content items below — if that rewiring isn't
> done, "verify stock quantities" and "remove test data" mean editing
> `src/data/*-seed.ts` and redeploying, not using the admin dashboard, and
> none of it survives a redeploy either way.

## Content & catalogue

- [ ] **Replace all placeholder images** — every product photo currently
  ships as a generated SVG placeholder (`scripts/generate-placeholders.mjs`,
  `public/images/`). Real photography is the single most launch-blocking
  visual gap; see the README's
  [Placeholder assets still required](../README.md#placeholder-assets-still-required)
  section for the full list (product shots, lifestyle images, journal
  cover images, OG fallback image).
- [ ] **Review all product information** — name, description, materials,
  care instructions, dimensions, packaging info for every SKU. Seed copy
  was written to demonstrate the schema, not as final retail copy.
- [ ] **Verify product pricing** — every `price`/`compareAtPrice` in the
  catalogue reflects real, current retail pricing (VAT-inclusive per South
  African convention — see `src/lib/cart.ts`'s tax handling). Cross-check
  scheduled sales (`saleStartsAt`/`saleEndsAt` fields) aren't accidentally
  still pointing at seed-data test dates.
- [ ] **Verify stock quantities** — every `stockQuantity` reflects real
  inventory on hand, not placeholder numbers. Set `lowStockThreshold`
  sensibly per product for the admin dashboard's low-stock warnings to be
  useful from day one.
- [ ] **Configure delivery rules** — delivery methods, fees, and zone
  adjustments in `src/config/delivery.ts` (base fees, metro/regional/
  outlying multipliers) and the free-delivery threshold in store settings
  (`/admin/settings`) match the business's real courier agreements, not
  the illustrative defaults — see the delivery lib's own doc comment
  ("illustrative estimator... needs an actual rate-card/geocoding
  integration").
- [ ] **Review all legal policies** — Privacy Policy, Terms of Service,
  Returns & Refund Policy, Delivery Policy, Payment Policy, Cookie Policy,
  Website Disclaimer. These pages carry a legal-review disclaimer banner
  (see the README's policy-pages section) precisely because they were
  drafted as structurally-complete templates, not reviewed by a lawyer for
  this specific business, jurisdiction, and terms — get that review before
  launch, then remove the disclaimer banner.
- [ ] **Confirm support contact details** — `contactEmail`,
  `contactPhone`, WhatsApp number, and social links in store settings
  (`/admin/settings` → General/Social) are the business's real, monitored
  channels, not placeholders.

## Checkout & payments

- [ ] **Complete payment testing** — for every payment method the business
  will actually offer, run a full checkout in that provider's sandbox:
  successful payment, failed payment, and (where the provider supports it)
  a cancelled payment, confirming each lands the customer on the right
  confirmation state and flips the order's status correctly. See
  [DEPLOYMENT.md §9](./DEPLOYMENT.md#9--payment-provider-configuration).
- [ ] **Test mobile checkout** specifically, not just desktop — on a real
  device per provider if possible, since PayFast/Yoco/Ozow/Peach's hosted
  payment pages are outside this app's own responsive testing and can
  behave differently on mobile Safari/Chrome than in a desktop browser.
- [ ] **Test order confirmation** — the confirmation page and email arrive
  correctly for a real (sandbox) successful payment, with correct order
  number, line items, totals, and delivery estimate.
- [ ] Confirm `ENABLE_TEST_PAYMENTS` is **unset or `false`** in the
  production environment (unless deliberately running a staging/demo
  deploy) — see [DEPLOYMENT.md §9](./DEPLOYMENT.md#9--payment-provider-configuration).
- [ ] Confirm every enabled provider has its sandbox flag switched off
  (`PAYFAST_SANDBOX=false`, `OZOW_SANDBOX=false`) and is using
  production credentials, not sandbox ones.

## Fulfilment & operations

- [ ] **Test fulfilment updates** — from `/admin/orders`, mark a real
  (sandbox-paid) order as fulfilled, add tracking info, and confirm the
  customer-facing order-status view and any status email reflect it
  correctly.
- [ ] **Create administrator accounts** — set `ADMIN_BOOTSTRAP_EMAILS` to
  the real founding admin(s), have each sign up once against production to
  claim the Super Administrator role, then grant any additional
  admin/staff roles from `/admin/team` (not via the env var — see the
  README's [Roles & permissions](../README.md#roles--permissions)
  section). Remove any test/demo admin accounts afterward.
- [ ] **Remove test data** — any orders, customers, coupons, or products
  created while testing the deploy (including every sandbox payment
  test above) — a fresh customer or investor looking at `/admin` shouldn't
  see "Test Product" or a R1 sandbox order.
- [ ] **Create a production backup** immediately after the above cleanup —
  see [DEPLOYMENT.md's Backup and recovery section](./DEPLOYMENT.md#backup-and-recovery)
  — this becomes your known-clean restore point.

## Email

- [ ] **Verify email delivery** end to end with the real provider and
  verified sending domain (not the console/file fallback) — send a real
  test order confirmation, password reset, and at least one admin
  notification email to a real inbox and confirm they arrive (check spam
  folder placement too, not just delivery) and render correctly across at
  least Gmail and Apple Mail/iOS. See
  [DEPLOYMENT.md §8](./DEPLOYMENT.md#8--email-domain-verification).

## Compliance & consent

- [ ] **Verify analytics consent** — with cookie consent declined, confirm
  no analytics/marketing script fires (open dev tools, decline in the
  cookie banner, confirm no `gtag`/`fbq`/`ttq`/Clarity network requests);
  with consent accepted, confirm they do. See `src/store/consent-store.ts`
  and `src/lib/analytics/track.ts`.
- [ ] **Verify the cookie banner** itself — first-visit behavior, that the
  choice persists across page loads and sessions, and that
  `/cookie-policy`'s "Manage preferences" control actually reopens it and
  changes take effect.

## SEO & discovery

- [ ] **Submit the sitemap** — `https://<domain>/sitemap.xml` (which
  references the product and journal sub-sitemaps — see
  `src/app/sitemap.ts` and the README's SEO section) — to Google Search
  Console once the domain is live.
- [ ] **Connect Search Console** — verify domain ownership (the
  `NEXT_PUBLIC_GSC_VERIFICATION` env var supports the HTML-tag method — see
  `.env.local.example`), submit the sitemap above, and check the domain
  has no pre-existing manual actions or coverage issues.
- [ ] **Test social sharing** — paste a few real page URLs (homepage, a
  product, a journal post) into Facebook's Sharing Debugger, Twitter/X's
  Card Validator, and a LinkedIn post composer to confirm OG images/titles/
  descriptions render correctly with the real production domain (some
  platforms cache a previous `*.vercel.app` preview-deployment fetch —
  force a re-scrape if so).

## Final technical checks

- [ ] Production build (`npm run build`), typecheck, and lint are all
  clean on the exact commit being deployed — see
  [Final production build verification](#) in the delivered summary for
  this session's own run.
- [ ] All items in
  [DEPLOYMENT.md's Order of operations](./DEPLOYMENT.md#order-of-operations)
  are complete, including the custom domain showing "Valid Configuration"
  in Vercel and HTTPS working with no browser warnings.
- [ ] Uptime monitoring (see
  [DEPLOYMENT.md](./DEPLOYMENT.md#uptime-monitoring-recommendations)) is
  live and alerting before, not after, announcing the launch.
