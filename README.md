# Clink & Co by HEIMSIGHT

Premium drinkware, glassware, barware, tableware and gifting — a Next.js
e-commerce site for a refined, editorial retail brand, priced in South
African Rand (ZAR).

> "Made for moments worth raising a glass to."

The homepage (`src/app/page.tsx`) is a complete, production-quality build:
hero carousel, benefit strip, category showcase, editorial feature, a
bestsellers carousel, new arrivals, curated collections, brand story,
customer reviews, a social gallery, a newsletter section and a
recently-viewed rail — all backed by the shared design system, layout
(header/mega menus/mobile drawer/search/footer/cookie consent) and cart/
wishlist state built in earlier passes.

The shop and product catalogue are also a complete build: `/shop`,
category and collection listing pages, and product detail pages, all with
real filtering, sorting, search and pagination — see
**"Shop & product catalogue"** below. Cart page / full checkout flow and
account pages are the next phase; the data layer, types and client state
here are already shaped to support them.

---

## Tech stack

| Concern            | Choice                                    |
| ------------------- | ------------------------------------------ |
| Framework           | Next.js 16 (App Router, Turbopack)         |
| Language            | TypeScript                                  |
| Styling             | Tailwind CSS v4 (CSS-based design tokens)  |
| Backend / Auth / DB | Supabase (`@supabase/ssr`)                 |
| Client state        | Zustand (cart, wishlist, recently viewed, cookie consent, UI — persisted to `localStorage` where relevant) |
| Forms               | React Hook Form + Zod                      |
| Icons               | lucide-react + a few hand-drawn marks (see below) |
| Animation           | Framer Motion                               |
| Images              | `next/image`                                |
| Currency            | ZAR (South African Rand) — see `src/config/site.ts` |

---

## Homepage sections → source files

| # | Section | Component | Backing data |
| - | ------- | --------- | ------------- |
| 1 | Hero (rotating carousel) | `src/components/sections/Hero.tsx` (+ `HeroWaypoint.tsx`) | `src/data/hero-slides.ts` |
| 2 | Customer benefit strip | `src/components/sections/FeatureStrip.tsx` | `src/config/site.ts` (delivery threshold, return window) |
| 3 | Shop by category | `src/components/sections/CategoryShowcase.tsx` (+ `product/CategoryCard.tsx`) | `src/data/categories.ts` |
| 4 | Editorial feature ("The Art of Hosting Well") | `src/components/sections/LifestyleSplit.tsx` (invoked from `page.tsx`) | copy inline in `page.tsx` |
| 5 | Bestsellers carousel | `src/components/sections/Bestsellers.tsx` (+ `product/ProductCard.tsx`) | `src/data/products.ts` (`getBestsellers()`) |
| 6 | New Arrivals grid | `src/components/sections/NewArrivals.tsx` | `src/data/products.ts` (`getNewArrivals()`) |
| 7 | Curated collections | `src/components/sections/CuratedCollections.tsx` | `src/data/collections.ts` |
| 8 | Brand story | `src/components/sections/BrandStory.tsx` | copy inline |
| 9 | Customer reviews carousel | `src/components/sections/ReviewsCarousel.tsx` | `src/data/reviews.ts` |
| 10 | Social gallery | `src/components/sections/SocialGallery.tsx` | inline list + `siteConfig.social` |
| 11 | Newsletter | `src/components/sections/NewsletterSection.tsx` | `src/lib/validations/newsletter.ts` |
| 12 | Recently viewed (conditional) | `src/components/sections/RecentlyViewed.tsx` | `src/store/recently-viewed-store.ts` |

Shared primitives these sections lean on: `src/components/ui/Carousel.tsx`
(prev/next + pagination-dot carousel, used by Hero and Reviews),
`src/lib/hooks/use-horizontal-scroll.ts` (the scroll-snap engine behind both
`Carousel` and the Bestsellers/category rows), `src/components/ui/Rating.tsx`
(star rating, used on `ProductCard` and reviews), and
`src/components/product/ProductCard.tsx`'s `detailed` prop (adds rating,
colour/style swatches and a discount badge — used by Bestsellers).

---

## Shop & product catalogue

### Routes

| Route | Page | Notes |
| --- | --- | --- |
| `/shop` | `src/app/shop/page.tsx` | Full catalogue, all 22 products |
| `/shop/[category]` | `src/app/shop/[category]/page.tsx` | One of the 6 categories, e.g. `/shop/glassware`; `notFound()` on an invalid slug; statically generated for all 6 |
| `/collections` | `src/app/collections/page.tsx` | Index of the 4 curated collections |
| `/collections/[collection]` | `src/app/collections/[collection]/page.tsx` | One curated collection, e.g. `/collections/home-bar-edit`; `notFound()` on an invalid slug; statically generated for all 4 |
| `/products/[slug]` | `src/app/products/[slug]/page.tsx` | Product detail page, e.g. `/products/ribbed-champagne-coupe-set` → `/products/solstice-coupe-glasses` in the seed data; `notFound()` on an invalid slug; statically generated for all 22 products |

`/shop/[category]` and `/collections/[collection]` both render the same
`ShopExperience` client component (`src/components/catalogue/ShopExperience.tsx`)
as `/shop`, passed a pre-scoped product list and a "locked" facet
(`lockedCategory` / `lockedCollection`) that hides the now-redundant filter
section (you can't un-filter "Glassware" from within `/shop/glassware`) —
one implementation, three entry points, so filtering/sorting/search/pagination
behave identically everywhere. All five routes are prerendered at build time
via `generateStaticParams`; `ShopExperience` itself is a Client Component
(it reads/writes `useSearchParams()`), so each route wraps it in
`<Suspense fallback={<ShopSkeleton />}>` — that Suspense boundary **is** the
page's loading state, not a simulated one.

### Filtering

Facets, all reflected in the URL as query parameters so any combination is
a shareable link:

| Facet | Query param | Example |
| --- | --- | --- |
| Category | `category` (CSV of slugs) | `?category=glassware,barware` |
| Product type | `type` (CSV) | `?type=Wine%20Glasses` |
| Collection | `collection` (CSV of collection ids) | `?collection=home-bar-edit` |
| Colour | `color` (CSV) | `?color=Ivory,Sage` |
| Material | `material` (CSV) | `?material=Solid%20oak` |
| Capacity | `capacity` (CSV) | `?capacity=300%20ml` |
| Set size | `set` (CSV) | `?set=Set%20of%204` |
| Price range | `price` (`min-max`) | `?price=500-2000` |
| Rating | `rating` (minimum, 3 or 4) | `?rating=4` |
| Availability | `availability=in-stock` | in-stock only |
| New arrivals | `new=1` | badge-driven |
| Sale products | `sale=1` | has a `compareAtPrice` |
| Search | `q` | also matches SKU/tags/collection — see below |
| Sort | `sort` | see table below |
| Load-more depth | `page` | how many pages of results have been loaded |

Desktop gets an always-visible sidebar (`FilterSidebar.tsx`) of expandable
`Disclosure` sections that apply each change immediately. Mobile gets a
slide-up sheet (`FilterDrawer.tsx`) with its own draft state — nothing
filters until **Apply filters (N)** is tapped, with a separate **Clear
all**. Both render the exact same `FilterPanel.tsx` content so they can
never drift apart. Active filters also surface as removable chips
(`ActiveFilterChips.tsx`) above the grid.

### Sorting

`Featured` (default) · `Newest` · `Best Selling` · `Price: Low to High` ·
`Price: High to Low` · `Highest Rated` · `Biggest Discount` — see
`SORT_OPTIONS` in `src/lib/catalogue.ts`.

### Product card & quick view

`ProductCard.tsx` shows: primary image, a secondary image swapped in on
hover, category label, name, collection/short description, price with a
struck-through original price and a `-N%` badge when on sale, `New` /
`Bestseller` / `Limited` / `Gift Edit` badges, an out-of-stock state
(dims the quick-add button, swaps its label to "Notify me"), star rating +
review count (in `detailed` mode), a wishlist heart button, a quick-view
eye button (only rendered where a handler is passed, e.g. the shop grid),
and colour/variant swatch dots. Quick view (`QuickView.tsx`) opens a modal
with the same core information plus a variant picker and "View full
details" link to the full PDP, without leaving the grid.

### Search

`src/lib/catalogue.ts`'s `searchProducts()` matches name, SKU, short/full
description, category name, product type, collection names and tags —
every whitespace-separated token in the query must match somewhere, via an
exact substring check first and a Levenshtein-distance-1 fallback per word
for basic typo tolerance (so "decantr" still finds "Decanter"). The same
function powers both `SearchModal.tsx` (the header's full-screen search,
which also keeps recent searches in `localStorage` and suggests popular
categories on no results) and the `q` filter on the shop pages, so a
search's "View all results" link and the shop's own search box behave
identically. `highlightMatch()` wraps the matched substring in `<mark>` for
visual emphasis in the search results list.

### Empty / loading / error states

`EmptyState.tsx` (with a query-aware headline and a "Clear all filters"
action when applicable), `ProductGridSkeleton.tsx` (the route-level
Suspense fallback, and reused while "Load more" is in flight), and
`ErrorState.tsx` (a defensive boundary around the filter/sort/search
pipeline — genuinely reachable once catalogue reads become real, possibly
failing network calls against Supabase).

### Pagination

Grid results load 12 at a time (`PRODUCTS_PER_PAGE` in `src/lib/catalogue.ts`)
via a "Load more" button (`LoadMoreButton.tsx`) with a short simulated
delay standing in for what will be a real async fetch once Supabase is
wired up; how many pages have been loaded is itself reflected in the URL's
`page` param, so a reloaded or shared URL restores exactly what was on
screen.

---

## Product detail page

`/products/[slug]` (`src/app/products/[slug]/page.tsx`) composes ~20 focused
components under `src/components/product/`, orchestrated by
`ProductDetailView.tsx`. A full breakdown of every state, component and data
requirement is in the chat write-up for this phase; in short:

- **Media** — `ProductGallery.tsx`: main image with hover-zoom, thumbnail
  rail, prev/next, a full-screen lightbox (its own zoom toggle, keyboard
  nav), an HTML5 `<video>` slide when `Product.videoUrl` is set, drag-to-swipe
  (Framer Motion), and variant-aware images (`ProductVariant.images`).
- **Purchase panel** — `StockStatus.tsx` (in-stock/low-stock/out-of-stock),
  `VariantSelectors.tsx` (colour + set-size, the latter via the new
  `Product.setSizeOptions`), `QuantitySelector.tsx`, `PurchaseActions.tsx`
  (add to cart / buy now / wishlist / share), `DeliveryEstimator.tsx`
  (`src/lib/delivery.ts` — an illustrative SA postal-code → zone/fee/ETA
  estimator with a checkout-confirms-final-cost disclaimer).
- **Details & trust** — `ProductAccordions.tsx` (description, specs,
  material, dimensions, capacity, care, delivery & returns, packaging),
  `KeyBenefits.tsx`, `ProductLifestyleSection.tsx` (reuses the homepage's
  `LifestyleSplit`, falling back to the category image), `PairsWellWith.tsx`
  and `TrustBadges.tsx`.
- **Social proof** — `ReviewsSection.tsx` (rating histogram, filter by
  star, sort, verified-purchase badge, photo thumbnails) and
  `WriteReviewForm.tsx` (rating/title/body/photos, persisted per-device via
  `submitted-reviews-store.ts` — no reviews API exists yet, see the
  write-up); `QandASection.tsx` mirrors the same pattern for questions via
  `submitted-questions-store.ts`.
- **States** — `ProductDetailSkeleton.tsx` (`loading.tsx`'s fallback),
  `error.tsx` (a real Next.js error boundary, not simulated),
  `NotifyWhenAvailable.tsx` (out of stock) and `DiscontinuedNotice.tsx`
  (`Product.discontinued` — excluded from shop/search listings via
  `activeProducts`, but its own PDP stays reachable and shows this instead
  of purchase actions).
- **Mobile** — `StickyAddToCart.tsx` appears once the main add-to-cart
  button scrolls out of view, via `IntersectionObserver`.
- **SEO** — `page.tsx` injects `Product` JSON-LD (offers, availability,
  aggregateRating, reviews).

---

## Checkout & payments

### Architecture

Cart totals shown to the customer (`src/lib/cart.ts`, `src/lib/promotions.ts`,
`src/lib/delivery.ts`) are **advisory only**. The single source of truth is
`POST /api/checkout` (`src/app/api/checkout/route.ts`), which re-derives
everything server-side before an order is ever created:

1. Zod-validates the payload (`src/lib/validations/checkout.ts`).
2. Looks up `findOrderByIdempotencyKey()` — if this exact checkout attempt
   already created an order, that order is returned as-is and nothing new is
   created (see "Duplicate orders" below).
3. Re-validates every cart line against live product data
   (`validateCartLines()` in `src/lib/cart-validation.ts`) — price, stock,
   discontinued status. A client can send stale prices/quantities; the server
   never trusts them.
4. Re-validates any coupon code (`validateCoupon()`) against the same
   scoping/date/usage-limit/minimum-spend rules the client already checked —
   redundantly, but authoritatively.
5. Re-quotes delivery (`quoteDelivery()`) for the chosen method/province/
   postal code, including the coupon's free-delivery flag if applicable.
6. Computes final totals (`computeCartTotals()`) and creates the order
   (`createOrder()` in `src/lib/orders/store.ts`).
7. Initiates payment via the chosen provider's `initiate()` and returns a
   `redirectUrl` for the client to navigate to.
8. Fires an admin new-order email in the background (`sendAdminOrderNotification()`)
   for every order; for EFT specifically it also fires the customer
   confirmation email immediately, since EFT has no webhook to trigger it
   later.

`src/lib/payments/` implements a single `PaymentProvider` interface
(`isConfigured()`, `initiate()`, `parseWebhook()`) per gateway
(`providers/{test,eft,payfast,peach,yoco,ozow}.ts`), registered in
`src/lib/payments/index.ts`. `getAvailablePaymentMethods()` filters to only
providers whose `isConfigured()` returns true — this is what "if enabled by
the administrator" means in practice: set a provider's env vars and it
appears at checkout, leave them unset and it doesn't. `GET
/api/payments/methods` exposes only `{id, label, description}` to the
client — never credentials.

Once the customer completes payment on the gateway's hosted page, the
gateway calls back to `POST /api/webhooks/payments/[provider]/route.ts`
server-to-server. That route calls the provider's `parseWebhook()` (which
verifies the request's signature and returns `null` — a 400 — if it doesn't
check out), maps the gateway's status to an internal `OrderStatus`, updates
the order, and sends the customer confirmation email on a fresh transition
to "paid" (not on every retried webhook delivery — see "Duplicate orders").
`GET /api/orders/[orderNumber]` then serves the finished order to the
confirmation page.

Checkout works for both guests and signed-in customers. `POST /api/checkout`
reads the current session (`getUser()` from `src/lib/supabase/dal.ts`) and
sets `Order.userId`/`isGuest` accordingly — a signed-in customer's order is
attached to their account the moment it's created, no separate claim step
needed. A guest order stays unattached until either the customer signs in
later with the same (verified) email — every login/sign-up auto-links any
guest orders on that email, see `linkGuestOrdersToUser()` in
`src/lib/orders/store.ts` — or they use the "Create an account" prompt
shown on the confirmation page for a guest order (`CreateAccountPrompt.tsx`),
which signs them up with that same email and gets the same auto-link for
free. See [Authentication & account](#authentication--account) below for
the full picture.

### Required payment credentials

| Provider | Env vars | Where to get them |
| --- | --- | --- |
| Test (mock gateway) | `ENABLE_TEST_PAYMENTS`, `TEST_PAYMENT_WEBHOOK_SECRET` | None — built in, for demos/dev/staging |
| EFT / bank transfer | `EFT_ENABLED` | None — manually reconciled, no gateway account |
| PayFast | `PAYFAST_MERCHANT_ID`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYFAST_SANDBOX` | PayFast merchant dashboard → Settings → Integration |
| Peach Payments | `PEACH_ENTITY_ID`, `PEACH_ACCESS_TOKEN`, `PEACH_API_BASE_URL`, `PEACH_WEBHOOK_SECRET` | Peach dashboard → Checkout API credentials |
| Yoco | `YOCO_SECRET_KEY`, `YOCO_WEBHOOK_SECRET` | Yoco portal → Online → API Keys |
| Ozow | `OZOW_SITE_CODE`, `OZOW_PRIVATE_KEY`, `OZOW_SANDBOX` | Ozow business portal → Settings → API |

All of the above are read only in server-side modules
(`src/lib/payments/providers/*.ts`, imported only from route handlers) —
never in a `"use client"` component, and never sent to the browser.
`src/config/payments.ts` is a deliberately separate, client-safe module that
holds only the *public* EFT bank-details display data, so `PaymentMethodStep.tsx`
can render it without pulling in the server-only provider code (which uses
Node's `crypto` module and cannot be bundled for the browser).

### Test vs. production settings

- The **test provider** (`src/lib/payments/providers/test.ts`) is available
  automatically outside production, or in production only if
  `ENABLE_TEST_PAYMENTS=true` is explicitly set — so a staging deploy can
  demo the full flow, but a real production deploy doesn't accidentally ship
  a fake "always succeeds" payment method. Its `/checkout/pay/[orderNumber]`
  page (`PaymentSimulatorView.tsx`) lets you pick Paid / Failed / Cancelled,
  which triggers a real signed webhook call from the server to
  `/api/webhooks/payments/test` — exercising the exact same webhook code
  path a live gateway would use, just without needing real merchant
  credentials to test it.
- **PayFast** and **Ozow** each expose a sandbox flag (`PAYFAST_SANDBOX`,
  `OZOW_SANDBOX`) that points `initiate()` at the gateway's sandbox host
  instead of production — flip it once real (non-sandbox) merchant
  credentials are issued.
- **Peach Payments** switches environment via `PEACH_API_BASE_URL` itself
  (defaults to Peach's test API host; set it to the production API host once
  live).
- **Yoco** doesn't have a separate sandbox — Yoco issues distinct test and
  live secret keys from the same dashboard, so switching environments is
  just swapping which key is in `YOCO_SECRET_KEY`.
- The PayFast, Peach, Yoco and Ozow provider implementations follow each
  gateway's public API/signature documentation but are **not yet verified
  against a live merchant account** — treat them as a correct-by-the-docs
  starting point to validate against sandbox credentials before going live,
  the same way you'd review any payment integration before launch.

### How duplicate orders are prevented

Two independent guards, matching the two ways a duplicate could happen:

1. **Duplicate order creation** (double-click "Place order", a network
   retry, browser back/forward after payment) — `CheckoutView.tsx` generates
   one `idempotencyKey` (`crypto.randomUUID()`) per checkout attempt and
   persists it in `sessionStorage` for the duration of that attempt, sending
   it on every `POST /api/checkout` call. The server checks
   `findOrderByIdempotencyKey()` *before* creating anything — if an order
   already exists for that key, it's returned unchanged rather than a second
   order being created. The key is only cleared from `sessionStorage` once
   the request actually succeeds.
2. **Duplicate webhook processing** (every real gateway retries webhook
   delivery until it gets a 200 — PayFast/Ozow/Yoco/Peach will all resend
   the same event) — `src/lib/orders/store.ts` tracks processed webhook
   events by a normalized `eventId` (`hasProcessedWebhookEvent()` /
   `markWebhookEventProcessed()`). The webhook route checks this before
   touching the order or sending any email, so a retried delivery for an
   already-processed event returns 200 immediately without reprocessing —
   which also means the confirmation email only ever fires once, on the
   first transition into `paid`.

`src/lib/orders/store.ts` is an in-memory store standing in for a real
`orders` table (its functions mirror what real Supabase queries would look
like: `findOrderByIdempotencyKey` ≈ `SELECT ... WHERE idempotency_key = $1`,
etc.) — moving to Supabase means giving `idempotency_key` a UNIQUE
constraint and doing the "does it already exist" check as an upsert, but the
call sites in `checkout/route.ts` and the webhook route don't need to
change.

---

## Authentication & account

Authentication itself is real Supabase Auth — not a mock. Sign-up, login,
logout, email verification, and password reset all call the genuine
Supabase Auth API and produce genuine, cookie-based sessions via
`@supabase/ssr`. What's *not* backed by a live database (for the same
reason `orders` isn't — this environment has no access to the Supabase
project's SQL editor/migrations) is the account *data* layered on top:
profiles, the address book, and return requests live in in-memory stores
(`src/lib/account/*.ts`) that mirror the exact shape of the real
`profiles`/`addresses` tables documented in `src/lib/supabase/types.ts`, the
same documented trade-off `src/lib/orders/store.ts` already makes. Swapping
either store's function bodies for real Supabase queries later is a
drop-in change — no call site changes.

### Sign-up, verification, login

- **Sign-up** — `SignupForm.tsx` posts to `POST /api/auth/signup`, which
  calls `supabase.auth.signUp()` server-side (so the route can rate-limit
  it and centralize error handling), creates the profile record
  (`ensureProfile()`), and links any guest orders already placed under that
  email (`linkGuestOrdersToUser()` — see below). If the Supabase project
  has email confirmation on (the default), the account exists but has no
  session until the link is clicked; the form shows a "check your inbox"
  state rather than pretending sign-up is complete.
- **Email verification** — Supabase emails a confirmation link. By default
  that link goes to Supabase's own hosted verify endpoint; for the branded,
  SSR-correct flow this build is written for, **customize the email
  templates in the Supabase dashboard** (Authentication → Email Templates)
  so the "Confirm signup" and "Reset password" templates link to this app
  instead:
  ```
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup
  {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery
  ```
  `GET /auth/confirm/route.ts` calls `supabase.auth.verifyOtp({ type,
  token_hash })`, which both verifies the link and establishes a real
  session server-side, then redirects: `recovery` → `/reset-password`,
  everything else → `/account?welcome=1`. Skipping this dashboard step
  doesn't break the app — Supabase's default hosted redirect still works —
  it just means the link doesn't land on this app's own confirm route.
- **Login** — `LoginForm.tsx` posts to `POST /api/auth/login`
  (`signInWithPassword`), which always returns the same generic "Invalid
  email or password" on any failure (wrong password, unknown email,
  unconfirmed email) — never revealing *which* — and is rate-limited both
  per-IP and per-email (see below). On success it also runs
  `linkGuestOrdersToUser()`, so a customer who checked out as a guest
  before ever creating an account still gets those orders attached the
  moment they first log in.
- **Password visibility toggle** — `PasswordInput.tsx`, a drop-in
  `Input` variant with an eye/eye-off button, used everywhere a password is
  typed (login, sign-up, reset, change-password).
- **Forgot / reset password** — `POST /api/auth/forgot-password` always
  responds with the same message ("If an account exists for that email,
  we've sent a link") whether or not the email is registered — the one
  place in this flow where confirming an email is or isn't registered
  would itself be the security leak. The recovery link lands on
  `/auth/confirm?type=recovery`, which establishes a session and redirects
  to `/reset-password`; that page is a Server Component that checks for a
  session before rendering the form at all, so a stale or already-used link
  shows "This link has expired" rather than a broken form.
  `POST /api/auth/reset-password` sets the new password via
  `updateUser()`, then **signs the session out** — the customer logs in
  fresh with the new password rather than staying signed in on whatever
  device happened to open the email link.
- **Logout** — `POST /api/auth/logout` (`supabase.auth.signOut()`), wired
  into `LogoutButton.tsx` (bottom of the account nav).
- **Social login structure** — `SocialLoginButtons.tsx` renders a "Continue
  with Google" button that calls `signInWithOAuth()` (a real, working PKCE
  flow via `/auth/callback/route.ts`), but only when
  `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true` **and** the Google provider is
  turned on in the Supabase dashboard (Authentication → Providers) — a step
  this codebase can't perform for you. Leave the flag unset and login/
  sign-up stay email/password-only.
- **Guest checkout + account creation after** — checkout never requires an
  account (see [Checkout & payments](#checkout--payments)). On the order
  confirmation page, a guest order shows `CreateAccountPrompt.tsx`: the
  email is pre-filled from the order (read-only) and locked in, so the
  customer only sets a password. Signing up this way runs the exact same
  `/api/auth/signup` route, which means the order that was just placed —
  and any other past guest order under that email — is linked immediately.

### Account dashboard

`/account` and everything under it is guarded twice: optimistically by
`src/proxy.ts` (redirects to `/login?redirect=<path>` on the cookie-level
check) and, the check that actually matters, by `requireUser()`
(`src/lib/supabase/dal.ts`) in `src/app/account/layout.tsx`, which
re-verifies the session against the Supabase Auth server (`getUser()`, not
a cookie read) before rendering anything. Every `/api/account/**` route
independently calls the same `getUser()` again — the layout guard is a nice
UX shortcut, not the security boundary.

- **`DashboardView.tsx`** — welcome message (first name from the profile),
  a "we linked N previous orders" banner (fires `POST
  /api/account/claim-orders` once per visit — safe to call repeatedly,
  already-linked orders are just skipped), the 3 most recent orders, and
  quick links to orders/addresses/profile/wishlist.
- **Order history** — `/account/orders` lists every order with status
  filter tabs (all/processing/fulfilled/cancelled); `/account/orders/
  [orderNumber]` shows the full detail (items, delivery + billing address,
  payment status and fulfilment status as two separate badges — see
  `src/lib/orders/status.ts` — tracking, payment reference); `/account/
  orders/[orderNumber]/invoice` is a print-styled tax invoice
  (`window.print()` → "Save as PDF" is the download mechanism, no PDF
  library needed). "Buy again" (`src/lib/buy-again.ts`) re-adds every line
  at *current* price/stock via a live product lookup, skipping and naming
  anything discontinued or out of stock rather than adding it at a stale
  price. "Request a return" opens a reason + notes modal
  (`POST .../return-request`, one open request per order, stored in
  `src/lib/account/returns-store.ts`); "Contact support" is a `mailto:`
  link pre-filled with the order number.
- **Address book** — `/account/addresses`: add/edit (one shared modal,
  `AddressFormModal.tsx`, keyed by address id so switching which address
  it edits always mounts fresh default values instead of needing a
  reset-on-prop-change effect), delete (two-click confirm), and one
  "default delivery" + one "default billing" flag per customer — setting a
  new default automatically clears the previous one
  (`src/lib/account/addresses-store.ts`).
- **Profile** — `/account/profile`: first/last name, email (changing it
  goes through Supabase's own re-verification — the new address only takes
  effect once its confirmation link is clicked, so the UI says so rather
  than claiming an instant change), mobile number, date of birth
  (optional), marketing consent.
- **Password & security** — `/account/security`: changing a password
  re-authenticates with the *current* password first
  (`signInWithPassword`) before calling `updateUser()` — an active session
  alone (e.g. a device left logged in) isn't enough to take over the
  account's credentials.
- **Preferences** — `/account/preferences`: the marketing-email toggle
  (same field as Profile's, shown here as its own settings page per the
  brief) plus an always-on, non-toggleable "order & shipping updates" row —
  transactional email can't be switched off, and the UI says why.
- **Payment methods** — `/account/payment-methods`: read-only, and
  deliberately so. It lists the *reference* from each past order's payment
  (e.g. `TEST-a1b2…`, `EFT-CC-260902-0001`) with an explanation that card/
  bank details themselves are never stored here — they live only with the
  PCI-DSS-compliant gateway (PayFast/Peach/Yoco/Ozow) that processed them.
  This is what "saved payment references where legally appropriate" means
  in practice: a reference, never a card number.
- **Role-based access** — `profiles.role` (`"customer" | "admin"`, default
  `"customer"`) and `requireRole("admin")` in `src/lib/supabase/dal.ts` are
  real and ready, but nothing sets a profile to `"admin"` and no admin
  surface calls `requireRole()` yet — there's no admin area in this build.
  Wired now so that surface doesn't need to retrofit authorization later.

### Security

- **Protected routes** — the full list is at the end of this section.
- **Server-side session validation** — every protected page and API route
  calls `getUser()`, which round-trips to the Supabase Auth server rather
  than trusting the session cookie's contents — the same distinction
  Supabase's own docs draw between `getSession()` (fast, optimistic) and
  `getUser()` (slow, authoritative). `proxy.ts` uses it for the fast
  redirect; the DAL and every `/api/account/**` route use it again for the
  real check.
- **Preventing cross-customer order access** — `GET /api/orders/
  [orderNumber]` (used by the just-checked-out confirmation page) is
  intentionally keyed by the order number alone, the standard pattern for
  a guest-checkout redirect. `GET /api/account/orders/[orderNumber]` (used
  by the account area) is the authenticated counterpart and is what
  actually enforces ownership: it 404s — the same response whether the
  order doesn't exist or belongs to someone else — unless
  `order.userId === session.user.id`. Knowing an order number is never
  sufficient by itself inside the account area.
- **Rate-limiting structure** — `src/lib/rate-limit.ts` is an in-memory
  fixed-window limiter, documented (like `orders/store.ts`) as a dev/demo
  substitute for a shared store (Upstash Redis, or similar) a real
  multi-instance deployment would need. Applied per-IP to sign-up and
  per-IP-*and*-per-email to login, forgot-password and change-password, so
  neither one attacker IP hammering many accounts nor a distributed attack
  hammering one account gets unlimited guesses.
- **Generic login errors** — covered above; login never distinguishes
  "wrong password" from "no such account" from "email unconfirmed".
- **Secure password reset** — covered above; the reset flow signs the
  session out after success rather than leaving the email-link session
  logged in.

### Protected routes

Every route under `/account/**` (`/account`, `/account/orders`,
`/account/orders/[orderNumber]`, `/account/orders/[orderNumber]/invoice`,
`/account/addresses`, `/account/profile`, `/account/security`,
`/account/preferences`, `/account/payment-methods`) and every route under
`/api/account/**` require a signed-in session — enforced twice, as
described above. `/login` and `/signup` redirect *away* to `/account` if
you're already signed in. `/reset-password` requires the session
established by a recovery link (or an existing session) rather than a
separate token. Everything else — `/`, `/shop`, `/products/**`, `/cart`,
`/checkout`, `/wishlist`, `/forgot-password` — stays open to guests, by
design.

---

## Admin dashboard

`/admin/**` is a secure internal tool the business uses to run the storefront
day-to-day — products, orders, customers, promotions, content, media, store
settings and team access — without touching code or redeploying. It has its
own full-page shell (sidebar nav + topbar, `AdminShell.tsx`) instead of the
storefront's Header/Footer (`SiteChrome.tsx` skips storefront chrome for any
`/admin` path).

### Architecture

- **Authorization is checked twice, independently**: `src/proxy.ts` gates
  `/admin/**` and `/api/admin/**` on having *any* signed-in session (same
  mechanism as `/account`), and `requireAdmin()` in `src/app/admin/layout.tsx`
  additionally requires the session's profile to hold one of the six admin
  roles below — a customer account is redirected away even though it's
  signed in. Every `/api/admin/**` route handler repeats the role/permission
  check server-side via `getAdminContext()` + `hasPermission()`, so the UI
  gating is a convenience, not the enforcement boundary.
- **Data lives in mutable in-memory stores** (`src/lib/admin/*-store.ts`,
  `src/lib/orders/store.ts`, `src/lib/account/profiles-store.ts`), the same
  development/demo substitute for Postgres used elsewhere in this build (see
  [Seed data & placeholder imagery](#seed-data--placeholder-imagery)) — every
  store function is written so swapping its body for a real Supabase query
  later doesn't change any call site. This is what makes admin edits appear
  live: reads and writes share the same in-process module state, so there's
  no build step, cache, or redeploy between an admin saving a change and the
  storefront rendering it.
- **Every mutating admin action is audit-logged** (`recordAuditLog()`) with
  the acting user, the action, the record affected, and before/after values
  — reviewable at `/admin/audit-log`.
- **Image uploads** go through `POST /api/admin/media` as base64 data URIs
  (capped at 2MB) rather than a cloud storage bucket, since this environment
  has no storage credentials configured — see
  [Environment variables](#environment-variables).

### Admin routes

| Route | Purpose |
| --- | --- |
| `/admin` | Dashboard — sales/orders/AOV, low & out-of-stock, recent orders, bestsellers, sales trend, order-status distribution |
| `/admin/products`, `/admin/products/new`, `/admin/products/[id]` | Product list, create, edit — images, variants, pricing/scheduling, stock, SEO, publish status |
| `/admin/categories` | Category CRUD, images, slugs, SEO, reorder |
| `/admin/collections` | Collection CRUD, product assignment |
| `/admin/orders`, `/admin/orders/[orderNumber]` | Order list/search/filter, detail, status/tracking, refund, cancel, notes, CSV export |
| `/admin/orders/[orderNumber]/invoice`, `/admin/orders/[orderNumber]/packing-slip` | Printable invoice and packing slip |
| `/admin/customers`, `/admin/customers/[id]` | Customer search, profile, order history, spend, notes, marketing consent, disable account |
| `/admin/promotions` | Discount codes, automatic discounts, free-delivery rules, restrictions, usage limits |
| `/admin/content` | Hero slides, banners, editorial section, about page, FAQs, journal, policy pages, newsletter copy, homepage section order |
| `/admin/media` | Media library — upload, search, folders/labels, alt text, replace, delete |
| `/admin/settings` | Business details, currency/tax, delivery/payment methods, email sender, order number format, return window, maintenance mode |
| `/admin/team` | Grant/change admin roles (view: all admins; edit: `team:write` only, i.e. `super_admin`/`store_admin`) |
| `/admin/audit-log` | Full history of admin actions — who, what, when, before/after |

Every page above has a matching `/api/admin/**` route family the UI calls
(e.g. `/admin/products` is backed by `GET/POST /api/admin/products` and
`GET/PATCH/DELETE /api/admin/products/[id]`, plus `/archive`, `/restore`,
`/duplicate`); they enforce the same permissions server-side and aren't
meant to be called directly.

### Roles & permissions

Every account is a `customer` by default; the six roles below are additive —
granting one turns on `/admin` access scoped to that role's permissions only,
without changing the account's ability to shop as a customer too. Roles are
granted at `/admin/team` (never through an env var, except for bootstrapping
the very first admin — see [Environment variables](#environment-variables)).

| Role | Can access |
| --- | --- |
| **Super Administrator** | Everything, including changing anyone's role |
| **Store Administrator** | Everything except granting/revoking admin roles |
| **Product Manager** | Dashboard, products, categories, collections, media |
| **Order Fulfilment** | Dashboard, orders (view/fulfil/export), customers (view), products (view) |
| **Content Editor** | Dashboard, content, media, categories (view) |
| **Customer Support** | Dashboard, customers (view/edit), orders (view) |

The full matrix (one row per resource × view/write) lives in
`src/lib/admin/roles.ts` (`ROLE_PERMISSIONS`) — the source of truth both the
UI and every API route check against.

### How content changes reach the storefront — and why no redeploy is needed

An admin edit (say, publishing a product, changing a hero slide, or turning
on maintenance mode) writes directly into the same in-memory store the
storefront reads from on every request — there's no separate "draft" copy
that needs publishing, no cache to invalidate, and no static site to
rebuild. The very next request to any storefront page — the homepage, a
product page, the footer newsletter copy — calls the same store function
and gets the change immediately. This is verified end-to-end for
promotional banners: `/admin/content` → Banners writes to
`content-store.ts`, and `PromoBannerBar.tsx` (rendered on every non-admin
page via `SiteChrome.tsx`) reads `getActiveBanners()` from that same store
on every render.

The one exception is **draft products and draft journal articles**: a draft
resolves directly at its real URL (so an admin can preview it) but is
excluded from listings/search/sitemaps until its publish status changes —
by design, not because anything needs redeploying.

In production, this same architecture holds once the in-memory stores are
swapped for real Supabase tables (each store function's body changes, no
call site does) — an admin save is a database write, and the next page
request is a database read, still with no redeploy in between.

---

## Folder structure

```
clink-co/
├─ public/
│  └─ images/                     Local placeholder imagery (see below)
├─ scripts/
│  └─ generate-placeholders.mjs   Regenerates the placeholder SVGs
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx                Root layout: fonts, metadata, Header/Footer/CookieBanner
│  │  ├─ page.tsx                  Homepage (assembles all 12 sections + JSON-LD)
│  │  ├─ globals.css               Design tokens (@theme) + base styles
│  │  ├─ shop/
│  │  │  ├─ page.tsx                /shop — full catalogue
│  │  │  └─ [category]/page.tsx     /shop/[category] — locked-category catalogue
│  │  ├─ collections/
│  │  │  ├─ page.tsx                /collections — index of curated collections
│  │  │  └─ [collection]/page.tsx   /collections/[collection] — locked-collection catalogue
│  │  └─ products/
│  │     └─ [slug]/page.tsx         /products/[slug] — product detail page
│  ├─ components/
│  │  ├─ ui/                       Button, Badge, Card, Input, Textarea, Label, Modal, Switch,
│  │  │                            Checkbox, Carousel, Rating, Disclosure (accordion section)
│  │  ├─ layout/                   Header, MegaMenu, MobileDrawer, Footer, Logo, NewsletterForm,
│  │  │                            CookieBanner, CookieSettingsLink, nav-data.ts (shared nav/footer data)
│  │  ├─ search/                   SearchModal (full-screen search overlay)
│  │  ├─ catalogue/                ShopExperience, FilterSidebar/FilterDrawer/FilterPanel,
│  │  │                            ActiveFilterChips, SortSelect, Breadcrumbs, ProductGrid,
│  │  │                            ProductGridSkeleton, ShopSkeleton, EmptyState, ErrorState,
│  │  │                            LoadMoreButton — see "Shop & product catalogue" above
│  │  ├─ product/                  ProductCard, CategoryCard, QuickView, ProductDetailView
│  │  ├─ sections/                 All 12 homepage sections — see table above
│  │  ├─ cart/                     CartDrawer
│  │  ├─ motion/                   Reveal (scroll-triggered fade-up)
│  │  └─ icons/                    SocialIcons, PaymentIcons — lucide-react dropped brand/payment marks
│  ├─ data/                        Seed data: products.ts (22 products), categories.ts, hero-slides.ts,
│  │                                collections.ts, reviews.ts
│  ├─ types/                       Product, Category domain types
│  ├─ config/
│  │  └─ site.ts                   Currency, locale, free-delivery threshold, social links, contact info
│  ├─ lib/
│  │  ├─ supabase/                 client.ts (browser), server.ts (RSC/actions), types.ts (DB schema)
│  │  ├─ validations/              Zod schemas: auth.ts, newsletter.ts (+ newsletterSectionSchema)
│  │  ├─ hooks/                    use-mounted.ts, use-horizontal-scroll.ts
│  │  ├─ catalogue.ts              Filter/sort/search + URL (de)serialization — see above
│  │  └─ utils.ts                  cn(), formatPrice(), slugify()
│  ├─ store/
│  │  ├─ cart-store.ts             Zustand cart (add/remove/update, persisted)
│  │  ├─ wishlist-store.ts         Zustand wishlist (toggle/has, persisted)
│  │  ├─ recently-viewed-store.ts  Tracks viewed products, persisted, capped at 8
│  │  ├─ consent-store.ts          Cookie consent decision (persisted)
│  │  └─ ui-store.ts               Cross-component UI signals (header-over-hero tracking)
│  └─ proxy.ts                     Supabase session refresh (Next.js "proxy"/middleware)
├─ .env.local.example
├─ next.config.ts
└─ tsconfig.json
```

---

## Design system

All design tokens live in `src/app/globals.css` under `@theme` (Tailwind v4's
CSS-native config) — there is no `tailwind.config.ts`.

- **Palette** (exact brand values):

  | Token | Hex | Usage |
  | --- | --- | --- |
  | `porcelain` | `#F7F5F0` | primary page background |
  | `warm-white` | `#FCFBF8` | card / header solid surfaces, text-on-dark |
  | `soft-grey` | `#E9E7E2` | subtle tints, dividers |
  | `sand` | `#D8CBBB` | section fills, light badges, borders |
  | `taupe` | `#A99B8A` | muted borders/icons, scrollbar thumb |
  | `stone` | `#746C62` | secondary/muted text |
  | `charcoal` | `#1C1C1A` | primary text, high-contrast sections |
  | `pure-black` | `#080808` | reserved for the deepest-contrast surfaces |
  | `green` | `#697262` | muted accent (availability, secondary emphasis) |
  | `champagne` | `#B69A68` | gifting / editorial highlight accent |
  | `success` | `#287A4B` | |
  | `error` | `#B42318` | |

  Use them as plain Tailwind classes: `bg-porcelain`, `text-stone`,
  `border-sand`, `text-champagne`, etc. — including arbitrary opacity, e.g.
  `bg-champagne/25`.

- **Radii** — `rounded-2xl` / `rounded-3xl` for cards and imagery,
  `rounded-full` for the nav, buttons and pills.
- **Type** — Inter (`font-sans`, default) for UI and body copy; Fraunces
  (`font-display`) for editorial headlines only. Fluid headline sizes use
  `clamp()`-based utility classes — `text-display-md` / `-lg` / `-xl` / `-2xl`
  — defined once in `globals.css` and applied directly (no manual
  `sm:`/`lg:` stacking needed for hero and section headings).
- **Motion** — `<Reveal>` wraps a section in a scroll-triggered fade-up
  (Framer Motion `whileInView`); Header, MegaMenu, MobileDrawer, SearchModal,
  CartDrawer, CookieBanner and the Hero/Reviews `Carousel` each use their own
  enter/exit transitions.
- **Accessibility** — a global `:focus-visible` outline (charcoal, 2px) is
  applied to every interactive element via `globals.css`, independent of
  each component's own styling; a "Skip to content" link is the first
  focusable element in `layout.tsx`; `prefers-reduced-motion` is respected
  site-wide.

## UI primitives (`src/components/ui`)

`Button` (variants: `primary` / `secondary` / `inverse` / `ghost` / `link`,
sizes `sm`/`md`/`lg`/`icon`), `Badge` (variants: `dark`/`light`/`sale`/
`outline`/`champagne`/`green`/`success`/`warning`/`error`/`neutral` — the
last three added for order-status badges, see [Authentication &
account](#authentication--account)), `Card` (+ Header/Title/Description/
Content/Footer), `Input`, `PasswordInput` (an `Input` variant with a
show/hide toggle), `Textarea`, `Label`, `Modal`, `Switch` (accessible
toggle, `role="switch"`), `Checkbox` (accessible, `role="checkbox"`),
`Carousel` (prev/next + pagination dots, autoplay, keyboard, one slide per
view — see below), `Rating` (star display with an `inverse` variant for dark
sections). All are built with `class-variance-authority` and `tailwind-merge`
(via the `cn()` helper), so they compose cleanly with extra `className`s from
call sites.

`Input`, `PasswordInput` and `Textarea` all render their `error` message as
visible text (an `id`-linked `<p>`, wired to the input via
`aria-describedby`) whenever a truthy `error` prop is passed, on top of the
red border/`aria-invalid` styling — every call site across every phase
already passes `error={errors.field?.message}` from react-hook-form, so this
was a from-the-source fix rather than a per-form one.

### Carousels

Three different carousel needs, two implementations, sharing one hook:

- **`Carousel`** (`src/components/ui/Carousel.tsx`) — one slide fills the
  viewport at a time; prev/next arrows, dot pagination, optional autoplay
  (pauses on hover/focus), `ArrowLeft`/`ArrowRight` keyboard support. Used
  by the **Hero** and **Reviews**.
- **Multi-item rows** (Bestsellers, the category showcase) use
  `useHorizontalScroll` (`src/lib/hooks/use-horizontal-scroll.ts`) directly
  with their own prev/next arrows and no dots, since "how many items are
  visible" varies by breakpoint — a dot-per-page doesn't generalise cleanly
  there. Mobile relies on native swipe (`overflow-x-auto` + scroll-snap);
  desktop gets the arrows.

Both are built on native CSS scroll-snap rather than a carousel library —
no extra dependency, and swipe support comes for free from the browser.

## Currency & site configuration

`src/config/site.ts` centralises the things an admin dashboard would
eventually expose as editable settings: currency/locale, the free-delivery
threshold, the return window, social links and the contact email/WhatsApp
number. `formatPrice()` (`src/lib/utils.ts`) reads `siteConfig.currency`
(ZAR) by default.

**Note on `formatPrice`:** it's deliberately *not* built on
`Intl.NumberFormat(locale, { style: "currency" })`. Node's default
(`small-icu`) build only ships full ICU data for English locales, so
`en-ZA` grouping can render differently server-side (Node, at build/request
time) than client-side (the browser, which always ships full ICU) — a real
hydration mismatch (`"R 1,450"` server vs. `"R 1 450"` client), caught while
QA-ing the Bestsellers carousel. The fix groups digits via the
always-available `en-US` locale and swaps the separator manually, so output
is byte-identical on both sides regardless of the runtime's ICU data.

## Header, navigation & the "over hero" effect

`Header` is `position: fixed`, so it visually floats over whatever renders
beneath it — including a page's hero. `<main>` in `layout.tsx` carries
`pt-24` to clear the header's height on ordinary pages; `Hero.tsx` cancels
that with `-mt-24` so it renders full-bleed from the very top, behind the
header.

Whether the header currently shows its transparent/tinted "over hero" style
or its solid scrolled style is **not** a scroll-position heuristic — it's
driven by `HeroWaypoint`, a 1px sentinel mounted at the bottom of a page's
hero, observed via `IntersectionObserver` and written to `useUIStore().overHero`.
Any future page that wants the same effect just renders `<HeroWaypoint />`
at the end of its hero section; pages that don't mount it get the header's
safe default (solid) from the start.

- **`MegaMenu`** — "Shop" and "Collections" open a dropdown panel on hover
  or keyboard. Keyboard support follows the WAI-ARIA disclosure pattern:
  `ArrowDown` on the trigger opens the panel *and* moves focus into its
  first link; `Escape` closes it and returns focus to the trigger; plain
  Tab-focus on the trigger does **not** auto-open it (only hover/click/
  ArrowDown do) — this is what avoids a focus/open feedback loop.
- **`MobileDrawer`** — slide-out panel below the `xl` breakpoint, with an
  accordion for Shop/Collections, account/wishlist links, help links and
  social icons.
- **`SearchModal`** — full-screen overlay with live product suggestions
  matched via `src/lib/catalogue.ts`'s `searchProducts()` (name, SKU,
  description, category, product type, collection and tags, with basic
  typo tolerance — see "Shop & product catalogue" above), result-text
  highlighting, recent searches (`localStorage`), popular-category
  suggestions on no results, and full keyboard navigation
  (`↑`/`↓`/`Enter`/`Escape`). Pressing Enter with no result selected routes
  to `/shop?q=<query>`, so a search and the shop's own filtering share one
  matching implementation.
- **`nav-data.ts`** centralizes nav links, collections, footer link groups,
  social links and contact info so Header/MegaMenu/MobileDrawer/Footer never
  drift out of sync.

## Cart, wishlist, recently viewed & cookie consent

`src/store/cart-store.ts` and `wishlist-store.ts` are Zustand stores
persisted to `localStorage` — this is the guest cart/wishlist storage the
brief asks for, and it's what every visitor uses right up until they sign
in (see [Authentication & account](#authentication--account) for what
happens then). `Header` reads their counts for the bag/heart badges; `ProductCard`'s "Quick add" and heart
button call them directly; `CartDrawer` (mounted once in `Header`) renders
the slide-in mini-cart, and `/cart` (`CartPageView.tsx`) is the full page.
No page-level integration is needed — `useCartStore()` / `useCartCount()` /
`useWishlistStore()` work from any client component.

- **Stock-aware quantities** — `addItem`/`updateQuantity` clamp against
  `product.stockQuantity`; `CartLineItem.tsx` also does a live
  `getProductBySlug()` lookup per line to show low-stock/out-of-stock/
  exceeds-available-stock messaging, since the store's own snapshot can go
  stale between visits.
- **Coupons** — `cart-store.ts` holds `coupon`/`couponError`; `applyCoupon()`/
  `removeCoupon()` call into `src/lib/promotions.ts` (`validateCoupon()`),
  which checks active/date-range/usage-limit/minimum-spend/product- or
  collection-scoping against `src/data/coupons.ts`. Every add/remove/quantity
  change re-validates the applied coupon (`revalidateCoupon()`) and silently
  drops it with an explanatory `couponError` if it's no longer eligible (e.g.
  the only matching line was removed). This is client-side UX only — see
  below for why the server never trusts it.
- **Wishlist** — `toggle(product)` (used by `ProductCard`'s heart button) and
  a separate `add(item)` (used to move a denormalized cart line to the
  wishlist without needing the full `Product` record) both live in
  `wishlist-store.ts`. `/wishlist` (`WishlistPageView.tsx`) shows live stock
  status per item and a "Share wishlist" button (Web Share API, clipboard
  fallback) that builds a `/wishlist/shared?items=slug1,slug2,...` link,
  resolved by `SharedWishlistView.tsx` for anyone who opens it (own account
  not required).
- **Guest/account merge** — `src/lib/merge.ts` has pure, store-agnostic
  `mergeCartLines()`/`mergeWishlistItems()` functions (guest quantities add
  to matching account lines rather than overwrite them; wishlist items
  de-duplicate by product id). `src/lib/hooks/use-auth-cart-sync.ts` wires
  these to Supabase's `onAuthStateChange`, mounted globally via
  `AuthCartSync.tsx` in `layout.tsx`. `SIGNED_IN` now genuinely fires (email
  login, sign-up, and — if enabled — OAuth all trigger it), so on every
  sign-in the guest cart/wishlist held in `localStorage` merges into the
  account's copy in place. `fetchAccountCart`/`fetchAccountWishlist` inside
  that hook are still stubbed to return `[]`, though — there's no real
  `cart_items`/`wishlist_items` Supabase table yet for a *second device* to
  restore an account's saved cart/wishlist from, so today the merge is
  effectively "the guest cart survives sign-in unchanged" rather than a true
  cross-device merge. Wiring those two fetches is the one remaining step
  once those tables exist; the merge algorithm itself doesn't change.

`src/store/recently-viewed-store.ts` records a lightweight product snapshot
whenever a `ProductCard` link is clicked (capped at 8, most-recent-first).
`RecentlyViewed.tsx` renders nothing until it's non-empty and the component
has mounted client-side (avoids a hydration mismatch against the
`localStorage`-backed state) — so on a first visit the section simply isn't
there, per the "only show if the customer has recently viewed products"
requirement.

`src/store/consent-store.ts` backs `CookieBanner` (Accept all / Reject
non-essential / Manage preferences, the last opening a `Modal` with
per-category `Switch` toggles). The decision persists to `localStorage`;
`CookieSettingsLink` in the footer calls `reset()` to reopen the banner.

## Seed data & placeholder imagery

### How catalogue data is currently stored

`src/data/products.ts` is a plain, in-memory TypeScript array of 22
`Product` objects (`src/types/product.ts`) — no database, no fetch, no
loading state at the data layer. Each product carries `sku`, short/full
`description`, `price`/`compareAtPrice` (ZAR), `images`, `categorySlug`
(one of 6 top-level categories), `productType` (a finer facet, e.g. "Wine
Glasses"), `collectionSlugs` (0+ curated collections), `material`,
`colors`/`variants` (swatches with optional per-option pricing),
`capacity`, `setSize`, `stockQuantity`/`inStock`, `featured`, `badges`,
`rating`/`reviewCount`, `tags`, `careInstructions`, `dimensions` and
`weightGrams`. Helper functions in the same file (`getProductBySlug`,
`getProductsByCategory`, `getBestsellers`, `getRelatedProducts`, etc.) are
the only way the rest of the app reads product data — components never
`.filter()`/`.find()` the array directly. `src/data/categories.ts` and
`collections.ts` follow the same pattern, and deliberately derive their
`itemCount` / product counts from the live `products` array (`products
.filter(...).length`) at module load rather than hardcoding a number that
could drift out of sync as products are added. All of this — plus
`src/data/hero-slides.ts` and `reviews.ts` for the Hero and Reviews
sections — is synchronous, so every page in this build (including
`/shop`, `/products/[slug]`, etc.) can be statically generated at build
time with `generateStaticParams`.

### How catalogue data will connect to Supabase

`src/lib/supabase/types.ts` already defines the target database schema —
the `Product`/`Category` shapes in `src/types/` were designed to match it
field-for-field, so the migration is a data-source swap, not a rewrite:

1. **Schema** — create `products`, `categories` and `collections` tables
   (plus a `product_collections` join table for the many-to-many
   relationship `collectionSlugs` represents) in Supabase using
   `src/lib/supabase/types.ts` as the DDL reference.
2. **Reads** — replace the `src/data/*.ts` arrays with query functions of
   the same name and signature (`getProductBySlug(slug)`,
   `getProductsByCategory(slug)`, etc.), backed by
   `src/lib/supabase/server.ts`'s server client, so every call site
   (`page.tsx` files, `ShopExperience`, `SearchModal`) keeps working
   unchanged — only the implementation behind each helper changes from an
   `Array.prototype` call to a `supabase.from("products").select(...)`
   call.
3. **Async boundary** — those helpers become `async`, which the route
   `page.tsx` files already anticipate (they're Server Components awaiting
   `params`/`generateMetadata`), so the change is additive there; the
   client-side pieces (`ShopExperience`, `SearchModal`) receive their
   product list as a prop from the server rather than importing the array
   directly, so their filter/sort/search logic in `src/lib/catalogue.ts` —
   which is already pure and framework-agnostic — needs no change at all.
4. **Filtering & search at scale** — `src/lib/catalogue.ts`'s
   `filterProducts`/`sortProducts`/`searchProducts` currently run in
   memory over the full catalogue; once product count outgrows what's
   reasonable to ship to the client, the same filter/sort inputs
   (`CatalogueFilters`, `SortKey`) translate directly into Supabase
   `.eq()`/`.in()`/`.gte()`/`.lte()`/`.order()` calls (and
   `.textSearch()` or `pg_trgm` for fuzzy search) run server-side, with
   `ErrorState`/`ProductGridSkeleton` becoming genuinely reachable states
   instead of the defensive/simulated ones they are today.
5. **Images** — swap the local placeholder SVG paths in `images: []` for
   Supabase Storage URLs (the `remotePatterns` example is already
   commented into `next.config.ts`) once real photography exists.

`src/data/categories.ts` (Glassware, Barware, Tableware, Serveware, Gift
Sets, Accessories) and `collections.ts` (4 curated collections) contain
realistic, Clink & Co–specific copy typed against `src/types/product.ts` /
`category.ts`. `src/data/hero-slides.ts` and `reviews.ts` back the Hero
and Reviews sections respectively.

Product, category, hero and editorial imagery is **not** final —
`public/images/` holds generated placeholder SVGs (soft brand-palette
gradients with a minimal vessel motif, **no text baked into the image
itself** — all copy is real HTML rendered by the page) so the UI can be
built and reviewed without external image hosting. Regenerate or extend them
with:

```bash
npm run generate:placeholders
```

Before launch, replace these with real photography — most simply via
Supabase Storage (uncomment the `remotePatterns` example in
`next.config.ts` and update the `image`/`images` fields in `src/data/`). See
**Placeholder assets still required** below for the full list.

---

## Environment variables

Copy the example file and fill in real values:

```bash
cp .env.local.example .env.local
```

| Variable                             | Required for                          |
| ------------------------------------- | -------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`            | Auth, database, storage                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Auth, database, storage — this alone is enough for full sign-up/login/logout/reset |
| `SUPABASE_SERVICE_ROLE_KEY`           | Server-only admin operations (not currently used by anything in this build) |
| `NEXT_PUBLIC_SITE_URL`                | Metadata / OpenGraph canonical URLs / JSON-LD / auth email redirect links |
| `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN`     | Shows the "Continue with Google" button (also requires enabling Google in the Supabase dashboard) |
| `ADMIN_BOOTSTRAP_EMAILS`              | Auto-grants Super Administrator to these emails on first sign-up/login — the only way to create your first admin. See [Admin dashboard](#admin-dashboard) below. |
| `ENABLE_TEST_PAYMENTS`                | Test payment provider in production (always on outside production) |
| `TEST_PAYMENT_WEBHOOK_SECRET`         | Test payment provider webhook signing  |
| `EFT_ENABLED`                         | EFT / bank transfer payment method (defaults on) |
| `PAYFAST_MERCHANT_ID` / `_MERCHANT_KEY` / `_PASSPHRASE` / `_SANDBOX` | PayFast payment method |
| `PEACH_ENTITY_ID` / `_ACCESS_TOKEN` / `_API_BASE_URL` / `_WEBHOOK_SECRET` | Peach Payments payment method |
| `YOCO_SECRET_KEY` / `YOCO_WEBHOOK_SECRET` | Yoco payment method                |
| `OZOW_SITE_CODE` / `_PRIVATE_KEY` / `_SANDBOX` | Ozow payment method              |
| `RESEND_API_KEY`                      | Transactional email / newsletter / order confirmations |

The app runs without any of these set — Supabase calls are structured to no-op
gracefully in `src/proxy.ts`, both newsletter forms currently simulate their
network call (marked with a `TODO` pointing at a `subscribers` table/edge
function) so their success/error states are real without a backend wired up
yet, and checkout always has at least one working payment method (Test and
EFT are on by default outside production) even with none of the payments vars
set. See [Checkout & payments](#checkout--payments) below for how each
gateway's credentials are used and how to enable/disable a method.

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.local.example .env.local
# then fill in your Supabase project URL/keys (optional for now — see above)

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build                 # production build
npm run start                 # serve the production build
npm run lint                  # ESLint
npm run generate:placeholders # regenerate placeholder SVG imagery
```

---

## Performance, SEO & conversion notes

- **Images** — every image goes through `next/image` with explicit `sizes`
  for responsive srcsets; the Hero's first slide is `priority`-loaded, all
  others lazy-load; placeholder SVGs are tiny (a gradient + one glyph) so
  they cost almost nothing over the wire.
- **Static generation** — the homepage has no per-request data dependency,
  so it's fully static-prerendered (`next build` reports it as `○ Static`).
- **SEO** — per-page `<title>`/`<meta description>`/OpenGraph tags live in
  `layout.tsx`; the homepage additionally injects `Organization` JSON-LD
  (name, social profiles, tagline) via a `<script type="application/ld+json">`
  in `page.tsx`. Semantic landmarks (`<header>`, `<main>`, `<footer>`,
  heading hierarchy starting at one `<h1>` in the Hero) are used throughout
  rather than generic `<div>`s.
- **Conversion affordances** — quick-add and wishlist directly from product
  cards (no page navigation required), a persistent cart badge, sale/new/
  out-of-stock/discount-percentage badges, star ratings and colour swatches
  on the Bestsellers carousel, a free-delivery threshold surfaced in the
  benefit strip, and a recently-viewed rail to reduce abandonment.

## Responsive behavior

Verified at phone (390px), tablet (834px) and desktop (1440px) widths:

- The full desktop nav (7 links + 2 mega menus + 4 icons) needs real room,
  so it shows at the `xl` breakpoint (1280px+); everything below that —
  phones **and** tablets — gets the compact bar (logo, search, bag, menu)
  and the slide-out `MobileDrawer`. This is a deliberate choice given the
  expanded nav requirements, not an oversight.
- The category showcase is a single, non-scrolling row of all 6 cards at
  `lg`+, a 3-column grid at `sm`–`lg`, and a swipeable scroll-snap row below
  `sm` (6 cards don't fit one screen on a phone).
- The Bestsellers carousel shows ~4 cards at `xl`, ~3 at `lg`, ~2 at `sm`,
  and a swipeable single-card-plus-peek row on phones; its arrow controls
  are `lg`+ only (mobile relies on touch swipe).
- Footer link columns collapse from a 6-column grid to 2 columns at `sm`
  and stack fully below that.
- The mega menus and search modal are full-width/full-screen affordances
  that don't apply below `xl` (mobile uses the drawer's accordion instead).

## Accessibility considerations

- Visible focus rings (`:focus-visible`, 2px charcoal outline) on every
  interactive element, not just the ones that opted in individually.
- A "Skip to content" link, visually hidden until focused.
- The mega menu follows the WAI-ARIA disclosure pattern (`aria-haspopup`,
  `aria-expanded`, `ArrowDown` to enter, `Escape` to exit and return focus)
  rather than only working for mouse/hover users.
- The `Carousel` primitive exposes `role="region" aria-roledescription="carousel"`,
  labels each slide (`aria-hidden` on off-screen slides), and its dot
  pagination uses `role="tablist"`/`role="tab"` with `aria-selected`.
- `aria-current="page"` plus a persistent underline mark the active nav
  item; `aria-label`s on all icon-only buttons (cart, wishlist, search,
  social links, close buttons, carousel arrows).
- Form controls: the newsletter section's checkbox/input wire `aria-invalid`
  and `aria-describedby` to their error text; the cookie preference `Switch`
  uses `role="switch"`/`aria-checked` with `htmlFor`/`aria-describedby` on
  each row.
- `prefers-reduced-motion` disables/shortens the site's custom transitions
  and scroll-behavior globally.
- Palette contrast was chosen deliberately: `charcoal`-on-`porcelain` and
  `warm-white`-on-`charcoal` are both high-contrast pairs for body text;
  `champagne` (a light, warm accent) is used as text only on dark
  (`charcoal`) backgrounds or as a background chip under dark text — never
  as small text on a light surface, where its contrast would be too low.
- lucide-react no longer ships brand/social marks, so `SocialIcons.tsx` and
  `PaymentIcons.tsx` are hand-drawn, stroke-matched replacements — see
  below for swapping in official logos before launch.
- **No text is baked into any image asset** — the Hero, editorial and
  collection imagery are pure gradients with a decorative glyph; every
  headline, price, badge and caption is real, accessible HTML.

---

## Placeholder assets still required

- **Product, category, hero and editorial photography** —
  `public/images/**` are generated gradient placeholders
  (`npm run generate:placeholders`), not real photos.
- **Official payment method logos**, if pixel-accurate brand marks are
  required — `PaymentIcons.tsx` currently ships simplified, non-trademarked
  monochrome badges (labelled Visa/Mastercard/Amex/PayPal/Apple Pay/Google
  Pay) rather than the official SVGs.
- **Real social handles & WhatsApp number** — `siteConfig.social` in
  `src/config/site.ts` points at placeholder handles/numbers; swap in the
  brand's actual accounts (this single file feeds the header, footer and
  social gallery, so it only needs updating in one place).
- **Contact email domain** — `siteConfig.contactEmail`
  (`hello@clinkandco.com`) is a placeholder pending the real domain.
- **Review authenticity** — `src/data/reviews.ts` is realistic sample copy,
  not real customer reviews; replace before launch or wire up a reviews
  table.

## Foundation checklist

- [x] Next.js (App Router) + TypeScript + Tailwind v4 project scaffold
- [x] Complete design system: exact brand palette, fluid type scale, UI primitives
- [x] Floating header: mega menus, mobile drawer, full-screen search, transparent-over-hero
- [x] Multi-column footer: policies, support, newsletter, socials, WhatsApp, payment icons
- [x] Cookie consent banner + preferences modal, persisted
- [x] Cart + wishlist + recently-viewed state (Zustand, persisted)
- [x] Zod validation schemas for auth and newsletter forms (incl. consent checkbox)
- [x] Supabase browser/server clients + session-refresh proxy (middleware)
- [x] `.env.local.example` with every required variable documented
- [x] Full 12-section homepage: hero carousel, benefit strip, category
      showcase, editorial feature, bestsellers carousel, new arrivals,
      curated collections, brand story, reviews carousel, social gallery,
      newsletter, recently viewed
- [x] ZAR pricing site-wide via a single, hydration-safe `formatPrice()`
- [x] Production build, lint and typecheck all passing; keyboard/focus
      flows and the full form + carousel + recently-viewed flows manually
      verified against both `next dev` and a production `next build`
- [x] Shop, category and collection listing pages (`/shop`,
      `/shop/[category]`, `/collections`, `/collections/[collection]`)
      with full filtering, sorting, search and load-more pagination, all
      reflected in shareable URL query parameters
- [x] Product detail page (`/products/[slug]`) built out in full: zoomable/
      swipeable/full-screen gallery with variant images and video support,
      colour + set-size selectors, quantity, buy now, share, a South
      African delivery estimator, an 8-section spec accordion, key
      benefits, a lifestyle section, "Pairs well with"/"You may also
      like"/Recently Viewed rails, reviews (filter/sort/write/photo
      upload/verified badge) and Q&A, a mobile sticky add-to-cart bar,
      loading/error/out-of-stock/discontinued states, and Product JSON-LD
- [x] Quick-view modal from the shop grid; enhanced global search (SKU/
      tags/collection matching, result highlighting, typo tolerance,
      recent searches, no-result suggestions)
- [x] 22-product seed catalogue with the full commerce schema (SKU,
      pricing, variants, stock, badges, ratings, tags, care, dimensions,
      benefits, pairings, set-size options — one flagged `discontinued`
      to exercise that PDP state end-to-end)
- [x] Production build, lint and typecheck all passing for the shop/
      catalogue and PDP builds; filter/sort/search flows, mobile filter
      drawer, gallery zoom/lightbox/swipe, delivery estimator, reviews
      (including a submit-with-photo round trip that survives reload) and
      the mobile sticky bar all manually verified in a real browser
      against both `next dev` and a production `next build`
- [ ] Cart page / full checkout flow (Stripe)
- [ ] Account pages (Supabase Auth: sign in, sign up, order history)
- [ ] Real product photography and the placeholder assets listed above
- [ ] Wire `src/data/*.ts` up to Supabase (schema + query functions — see
      "How catalogue data will connect to Supabase" above)
