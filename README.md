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
wishlist state built in earlier passes. Catalog listing, product detail,
cart and checkout *pages* are the next phase; the data layer, types and
client state here are already shaped to support them.

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
│  │  └─ globals.css               Design tokens (@theme) + base styles
│  ├─ components/
│  │  ├─ ui/                       Button, Badge, Card, Input, Textarea, Label, Modal, Switch,
│  │  │                            Checkbox, Carousel, Rating
│  │  ├─ layout/                   Header, MegaMenu, MobileDrawer, Footer, Logo, NewsletterForm,
│  │  │                            CookieBanner, CookieSettingsLink, nav-data.ts (shared nav/footer data)
│  │  ├─ search/                   SearchModal (full-screen search overlay)
│  │  ├─ product/                  ProductCard, CategoryCard
│  │  ├─ sections/                 All 12 homepage sections — see table above
│  │  ├─ cart/                     CartDrawer
│  │  ├─ motion/                   Reveal (scroll-triggered fade-up)
│  │  └─ icons/                    SocialIcons, PaymentIcons — lucide-react dropped brand/payment marks
│  ├─ data/                        Seed data: products.ts, categories.ts, hero-slides.ts,
│  │                                collections.ts, reviews.ts
│  ├─ types/                       Product, Category domain types
│  ├─ config/
│  │  └─ site.ts                   Currency, locale, free-delivery threshold, social links, contact info
│  ├─ lib/
│  │  ├─ supabase/                 client.ts (browser), server.ts (RSC/actions), types.ts (DB schema)
│  │  ├─ validations/              Zod schemas: auth.ts, newsletter.ts (+ newsletterSectionSchema)
│  │  ├─ hooks/                    use-mounted.ts, use-horizontal-scroll.ts
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
`outline`/`champagne`/`green`/`success`), `Card` (+ Header/Title/Description/
Content/Footer), `Input`, `Textarea`, `Label`, `Modal`, `Switch` (accessible
toggle, `role="switch"`), `Checkbox` (accessible, `role="checkbox"`),
`Carousel` (prev/next + pagination dots, autoplay, keyboard, one slide per
view — see below), `Rating` (star display with an `inverse` variant for dark
sections). All are built with `class-variance-authority` and `tailwind-merge`
(via the `cn()` helper), so they compose cleanly with extra `className`s from
call sites.

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
  (filtered client-side against seed data), recent searches
  (`localStorage`), popular categories, and full keyboard navigation
  (`↑`/`↓`/`Enter`/`Escape`).
- **`nav-data.ts`** centralizes nav links, collections, footer link groups,
  social links and contact info so Header/MegaMenu/MobileDrawer/Footer never
  drift out of sync.

## Cart, wishlist, recently viewed & cookie consent

`src/store/cart-store.ts` and `wishlist-store.ts` are Zustand stores
persisted to `localStorage`. `Header` reads their counts for the bag/heart
badges; `ProductCard`'s "Quick add" and heart button call them directly;
`CartDrawer` (mounted once in `Header`) renders the slide-in bag. No
page-level integration is needed — `useCartStore()` / `useCartCount()` /
`useWishlistStore()` work from any client component.

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

`src/data/products.ts` (18 products across 6 categories, priced in ZAR,
several with colour/style `variants`) and `src/data/categories.ts`
(Glassware, Barware, Tableware, Serveware, Gift Sets, Accessories) contain
realistic, Clink & Co–specific copy typed against `src/types/product.ts` /
`category.ts`. `src/data/hero-slides.ts`, `collections.ts` and `reviews.ts`
back the Hero, Curated Collections and Reviews sections respectively. Swap
all of these for Supabase queries once the corresponding tables exist — the
product/category shapes already match `src/lib/supabase/types.ts`.

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
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`       | Auth, database, storage                |
| `SUPABASE_SERVICE_ROLE_KEY`           | Server-only admin operations           |
| `NEXT_PUBLIC_SITE_URL`                | Metadata / OpenGraph canonical URLs / JSON-LD |
| `STRIPE_SECRET_KEY`                   | Checkout (not yet implemented)         |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | Checkout (not yet implemented)         |
| `STRIPE_WEBHOOK_SECRET`               | Checkout (not yet implemented)         |
| `RESEND_API_KEY`                      | Transactional email / newsletter       |

The app runs without any of these set — Supabase calls are structured to no-op
gracefully in `src/proxy.ts`, and both newsletter forms currently simulate
their network call (marked with a `TODO` pointing at a `subscribers`
table/edge function) so their success/error states are real without a
backend wired up yet.

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
- [ ] Shop / category listing pages, filtering & sorting
- [ ] Product detail page
- [ ] Cart page / full checkout flow (Stripe)
- [ ] Account pages (Supabase Auth: sign in, sign up, order history)
- [ ] Real product photography and the placeholder assets listed above
