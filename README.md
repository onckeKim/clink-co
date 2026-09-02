# Clink & Co by HEIMSIGHT

Premium drinkware, glassware, barware, tableware and gifting — a Next.js
e-commerce foundation built for a refined, editorial retail brand.

> "Made for moments worth raising a glass to."

This repository is currently a **project foundation**: a full design system,
shared layout (header, mega menus, mobile drawer, search, footer, cookie
consent), reusable UI primitives, and a homepage that demonstrates them
together. Catalog, product detail, cart and checkout *pages* are the next
phase — the pieces above (cart/wishlist state, types, seed data) are already
built to support them.

---

## Tech stack

| Concern            | Choice                                    |
| ------------------- | ------------------------------------------ |
| Framework           | Next.js 16 (App Router, Turbopack)         |
| Language            | TypeScript                                  |
| Styling             | Tailwind CSS v4 (CSS-based design tokens)  |
| Backend / Auth / DB | Supabase (`@supabase/ssr`)                 |
| Client state        | Zustand (cart, wishlist, cookie consent, UI — persisted to `localStorage` where relevant) |
| Forms               | React Hook Form + Zod                      |
| Icons               | lucide-react + a few hand-drawn marks (see below) |
| Animation           | Framer Motion                               |
| Images              | `next/image`                                |

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
│  │  ├─ page.tsx                  Homepage (assembles the sections below)
│  │  └─ globals.css               Design tokens (@theme) + base styles
│  ├─ components/
│  │  ├─ ui/                       Button, Badge, Card, Input, Textarea, Label, Modal, Switch
│  │  ├─ layout/                   Header, MegaMenu, MobileDrawer, Footer, Logo, NewsletterForm,
│  │  │                            CookieBanner, CookieSettingsLink, nav-data.ts (shared nav/footer data)
│  │  ├─ search/                   SearchModal (full-screen search overlay)
│  │  ├─ product/                  ProductCard, CategoryCard
│  │  ├─ sections/                 Hero, HeroWaypoint, FeatureStrip, SectionHeading, LifestyleSplit
│  │  ├─ cart/                     CartDrawer
│  │  ├─ motion/                   Reveal (scroll-triggered fade-up)
│  │  └─ icons/                    SocialIcons, PaymentIcons — lucide-react dropped brand/payment marks
│  ├─ data/                        Seed data: products.ts, categories.ts
│  ├─ types/                       Product, Category domain types
│  ├─ lib/
│  │  ├─ supabase/                 client.ts (browser), server.ts (RSC/actions), types.ts (DB schema)
│  │  ├─ validations/              Zod schemas: auth.ts, newsletter.ts
│  │  ├─ hooks/                    use-mounted.ts
│  │  └─ utils.ts                  cn(), formatPrice(), slugify()
│  ├─ store/
│  │  ├─ cart-store.ts             Zustand cart (add/remove/update, persisted)
│  │  ├─ wishlist-store.ts         Zustand wishlist (toggle/has, persisted)
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
  CartDrawer and CookieBanner each use their own enter/exit transitions.
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
toggle, `role="switch"`). All are built with `class-variance-authority` and
`tailwind-merge` (via the `cn()` helper), so they compose cleanly with extra
`className`s from call sites.

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

## Cart, wishlist & cookie consent

`src/store/cart-store.ts` and `wishlist-store.ts` are Zustand stores
persisted to `localStorage`. `Header` reads their counts for the bag/heart
badges; `ProductCard`'s "Quick add" and heart button call them directly;
`CartDrawer` (mounted once in `Header`) renders the slide-in bag. No
page-level integration is needed — `useCartStore()` / `useCartCount()` /
`useWishlistStore()` work from any client component.

`src/store/consent-store.ts` backs `CookieBanner` (Accept all / Reject
non-essential / Manage preferences, the last opening a `Modal` with
per-category `Switch` toggles). The decision persists to `localStorage`;
`CookieSettingsLink` in the footer calls `reset()` to reopen the banner.

## Seed data & placeholder imagery

`src/data/products.ts` and `src/data/categories.ts` contain realistic,
Clink & Co–specific copy (14 products across 6 categories) typed against
`src/types/product.ts` / `category.ts`. Swap these for Supabase queries once
the `products` / `categories` tables exist — the shapes already match
`src/lib/supabase/types.ts`.

Product and category photography is **not** final — `public/images/` holds
generated placeholder SVGs (soft brand-palette gradients with a minimal
vessel motif) so the UI can be built and reviewed without external image
hosting. Regenerate or extend them with:

```bash
npm run generate:placeholders
```

Before launch, replace these with real photography — most simply via
Supabase Storage (uncomment the `remotePatterns` example in
`next.config.ts` and update the `images` arrays in `src/data/`). See
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
| `NEXT_PUBLIC_SITE_URL`                | Metadata / OpenGraph canonical URLs    |
| `STRIPE_SECRET_KEY`                   | Checkout (not yet implemented)         |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`  | Checkout (not yet implemented)         |
| `STRIPE_WEBHOOK_SECRET`               | Checkout (not yet implemented)         |
| `RESEND_API_KEY`                      | Transactional email / newsletter       |

The app runs without any of these set — Supabase calls are structured to no-op
gracefully in `src/proxy.ts`, and the newsletter form currently logs to the
console instead of calling Supabase (marked with a `TODO` in
`NewsletterForm.tsx`).

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

## Responsive behavior

Verified at phone (390px), tablet (834px) and desktop (1440px) widths:

- The full desktop nav (7 links + 2 mega menus + 4 icons) needs real room,
  so it shows at the `xl` breakpoint (1280px+); everything below that —
  phones **and** tablets — gets the compact bar (logo, search, bag, menu)
  and the slide-out `MobileDrawer`. This is a deliberate choice given the
  expanded nav requirements, not an oversight.
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
- `aria-current="page"` plus a persistent underline mark the active nav
  item; `aria-label`s on all icon-only buttons (cart, wishlist, search,
  social links, close buttons).
- The cookie preference `Switch` uses `role="switch"` / `aria-checked`;
  each row's label and description are wired via `htmlFor` / `aria-describedby`.
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

---

## Files created or changed in this pass

**New:** `MegaMenu.tsx`, `MobileDrawer.tsx`, `nav-data.ts`, `CookieBanner.tsx`,
`CookieSettingsLink.tsx`, `SearchModal.tsx`, `HeroWaypoint.tsx`, `Switch.tsx`,
`PaymentIcons.tsx`, `wishlist-store.ts`, `consent-store.ts`, `ui-store.ts`.

**Rewritten:** `globals.css` (full palette + fluid type scale), `Header.tsx`
(fixed positioning, mega menus, transparent-over-hero, wishlist icon, active
indicator), `Footer.tsx` (6-column layout, WhatsApp, payment icons, delivery
info), `Logo.tsx` (`compact` variant), `layout.tsx` (skip link, header
clearance, CookieBanner mount).

**Updated (token migration + fixes):** every existing component's color
classes (`ink`→`charcoal`, `ivory`→`warm-white`, `clay`→`stone`,
`brass`→`champagne`), `Badge.tsx` variants, `ProductCard.tsx` (wishlist
wiring + a `fill`-image positioning fix), `SocialIcons.tsx` (added TikTok,
Pinterest, WhatsApp).

## Placeholder assets still required

- **Product & category photography** — `public/images/**` are generated
  gradient placeholders (`npm run generate:placeholders`), not real photos.
- **Official payment method logos**, if pixel-accurate brand marks are
  required — `PaymentIcons.tsx` currently ships simplified, non-trademarked
  monochrome badges (labelled Visa/Mastercard/Amex/PayPal/Apple Pay/Google
  Pay) rather than the official SVGs.
- **Real social handles & WhatsApp number** — `nav-data.ts`'s `socialLinks`
  point at the bare platform domains, and `contactInfo.whatsappHref` uses a
  placeholder number; swap in the brand's actual accounts.
- **Contact email domain** — `contactInfo.email` (`hello@clinkandco.com`) is
  a placeholder pending the real domain.

## Foundation checklist

- [x] Next.js (App Router) + TypeScript + Tailwind v4 project scaffold
- [x] Complete design system: exact brand palette, fluid type scale, UI primitives
- [x] Floating header: mega menus, mobile drawer, full-screen search, transparent-over-hero
- [x] Multi-column footer: policies, support, newsletter, socials, WhatsApp, payment icons
- [x] Cookie consent banner + preferences modal, persisted
- [x] Cart + wishlist state (Zustand, persisted), wired into Header and ProductCard
- [x] Zod validation schemas for auth and newsletter forms
- [x] Supabase browser/server clients + session-refresh proxy (middleware)
- [x] `.env.local.example` with every required variable documented
- [x] Homepage assembling Hero, FeatureStrip, category grid, editorial splits, bestsellers and a closing CTA
- [x] Production build, lint and typecheck all passing; keyboard/focus flows manually verified
- [ ] Shop / category listing pages, filtering & sorting
- [ ] Product detail page
- [ ] Cart page / full checkout flow (Stripe)
- [ ] Account pages (Supabase Auth: sign in, sign up, order history)
- [ ] Real product photography and the placeholder assets listed above
