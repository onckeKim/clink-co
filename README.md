# Clink & Co by HEIMSIGHT

Premium drinkware, glassware, barware, tableware and gifting — a Next.js
e-commerce foundation built for a refined, editorial retail brand.

> "Made for moments worth raising a glass to."

This repository is currently a **project foundation**: design system, shared
layout, reusable UI primitives, and a homepage that demonstrates them
together. Catalog, product detail, cart and checkout *pages* are the next
phase — the pieces above (cart state, types, seed data) are already built to
support them.

---

## Tech stack

| Concern            | Choice                                    |
| ------------------- | ------------------------------------------ |
| Framework           | Next.js 16 (App Router, Turbopack)         |
| Language            | TypeScript                                  |
| Styling             | Tailwind CSS v4 (CSS-based design tokens)  |
| Backend / Auth / DB | Supabase (`@supabase/ssr`)                 |
| Cart / client state | Zustand (persisted to `localStorage`)      |
| Forms               | React Hook Form + Zod                      |
| Icons               | lucide-react                                |
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
│  │  ├─ layout.tsx                Root layout: fonts, metadata, Header/Footer
│  │  ├─ page.tsx                  Homepage (assembles the sections below)
│  │  └─ globals.css               Design tokens (@theme) + base styles
│  ├─ components/
│  │  ├─ ui/                       Button, Badge, Card, Input, Textarea, Label, Modal
│  │  ├─ layout/                   Header, Footer, Logo, NewsletterForm
│  │  ├─ product/                  ProductCard, CategoryCard
│  │  ├─ sections/                 Hero, FeatureStrip, SectionHeading, LifestyleSplit
│  │  ├─ cart/                     CartDrawer
│  │  ├─ motion/                   Reveal (scroll-triggered fade-up)
│  │  └─ icons/                    Hand-drawn social marks (lucide-react dropped brand icons)
│  ├─ data/                        Seed data: products.ts, categories.ts
│  ├─ types/                       Product, Category domain types
│  ├─ lib/
│  │  ├─ supabase/                 client.ts (browser), server.ts (RSC/actions), types.ts (DB schema)
│  │  ├─ validations/              Zod schemas: auth.ts, newsletter.ts
│  │  ├─ hooks/                    use-mounted.ts
│  │  └─ utils.ts                  cn(), formatPrice(), slugify()
│  ├─ store/
│  │  └─ cart-store.ts             Zustand cart (add/remove/update, persisted)
│  └─ proxy.ts                     Supabase session refresh (Next.js "proxy"/middleware)
├─ .env.local.example
├─ next.config.ts
└─ tsconfig.json
```

---

## Design system

All design tokens live in `src/app/globals.css` under `@theme` (Tailwind v4's
CSS-native config) — there is no `tailwind.config.ts`.

- **Palette** — warm neutrals: `ivory`, `linen`, `sand`, `stone`, `taupe`,
  `clay`, plus `ink` (near-black, used for high-contrast sections and text)
  and a `brass` accent reserved for gifting highlights. Use them as Tailwind
  classes directly: `bg-ivory`, `text-clay`, `border-sand`, etc.
- **Radii** — `rounded-2xl` / `rounded-3xl` for cards and imagery,
  `rounded-full` for the nav, buttons and pills.
- **Type** — Inter (`font-sans`, default) for UI and body copy; Fraunces
  (`font-display`) for editorial headlines only, applied via the
  `.font-display` utility class.
- **Motion** — `<Reveal>` wraps a section in a scroll-triggered fade-up
  (Framer Motion `whileInView`); the Header, mobile nav and CartDrawer use
  their own enter/exit transitions.

## UI primitives (`src/components/ui`)

`Button` (variants: `primary` / `secondary` / `inverse` / `ghost` / `link`,
sizes `sm`/`md`/`lg`/`icon`), `Badge` (variants: `dark`/`light`/`sale`/
`outline`/`brass`/`success`), `Card` (+ Header/Title/Description/Content/
Footer), `Input`, `Textarea`, `Label`, `Modal`. All are built with
`class-variance-authority` and `tailwind-merge` (via the `cn()` helper), so
they compose cleanly with extra `className`s from call sites.

## Cart

`src/store/cart-store.ts` is a Zustand store persisted to `localStorage`.
`Header` reads the item count, `ProductCard`'s "Quick add" button calls
`addItem()`, and `CartDrawer` (mounted once in `Header`) renders the slide-in
bag with quantity controls and a subtotal. No page-level integration is
needed to use it elsewhere — `useCartStore()` / `useCartCount()` /
`useCartSubtotal()` work from any client component.

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
`next.config.ts` and update the `images` arrays in `src/data/`).

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

## Foundation checklist

- [x] Next.js (App Router) + TypeScript + Tailwind v4 project scaffold
- [x] Dependencies installed: Supabase, Zustand, Zod, React Hook Form, lucide-react, Framer Motion
- [x] Design tokens & global styles (`globals.css`, warm neutral palette, Inter + Fraunces)
- [x] Root layout wiring fonts, metadata, Header and Footer
- [x] Header (rounded floating nav, mobile menu, cart icon) and Footer (newsletter, sitemap)
- [x] Reusable UI primitives: Button, Badge, Card, Input, Textarea, Label, Modal
- [x] Product & Category types, matched to a Supabase `Database` type placeholder
- [x] Seed data: 14 products / 6 categories with original Clink & Co copy
- [x] Zustand cart store + CartDrawer, wired into the Header
- [x] Zod validation schemas for auth and newsletter forms
- [x] Supabase browser/server clients + session-refresh proxy (middleware)
- [x] `.env.local.example` with every required variable documented
- [x] Homepage assembling Hero, FeatureStrip, category grid, editorial splits, bestsellers and a closing CTA
- [x] Production build, lint and typecheck all passing
- [ ] Shop / category listing pages, filtering & sorting
- [ ] Product detail page
- [ ] Cart page / full checkout flow (Stripe)
- [ ] Account pages (Supabase Auth: sign in, sign up, order history)
- [ ] Real product photography (replace `public/images` placeholders)
