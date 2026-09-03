# Clink & Co — Supabase database

This is the real, production-target database schema for the storefront and
admin dashboard: 35 tables, full Row Level Security, storage buckets, seed
data, generated TypeScript types, and a data-access layer with typed error
handling. It lives entirely under `supabase/` and `src/lib/db/` /
`src/lib/supabase/` and does **not** replace the app's existing in-memory
stores (`src/lib/admin/*-store.ts`, `src/lib/orders/store.ts`,
`src/lib/account/*-store.ts`) — this sandbox has no live Supabase project to
run migrations against, so the app keeps running on those until you connect
a real project and do the swap-over (see [Relationship to the in-memory
stores](#relationship-to-the-in-memory-stores)).

## Contents

```
supabase/
├── migrations/          11 numbered SQL migrations, applied in order
├── seed.sql              Development seed data (supabase db reset runs this automatically)
└── README.md              This file

src/lib/supabase/
├── types.ts               Database type definitions (Row/Insert/Update per table + Enums + Functions)
├── service.ts              Service-role client (bypasses RLS — server-only, narrow use)
├── server.ts / client.ts   Existing session-aware clients (unchanged)
└── safe-client.ts          Existing "null instead of throw" wrapper (unchanged)

src/lib/db/
├── errors.ts               Typed error hierarchy + Postgres error code mapping
├── client.ts                getDb() — the session-aware client every module below uses
├── products.ts, categories.ts, collections.ts, cart.ts, wishlist.ts,
│   addresses.ts, profiles.ts, orders.ts, reviews.ts, discounts.ts, audit.ts
```

## Table relationship summary

```
auth.users (Supabase Auth)
  └─ profiles (1:1, id = auth.users.id)
       ├─ user_roles (1:1 today — unique(user_id); role grants, feeds profiles.role)
       ├─ addresses (1:N)
       ├─ carts (1:N, usually 1 active) ─── cart_items (1:N) ─┐
       ├─ wishlists (1:1) ─── wishlist_items (1:N) ───────────┤
       ├─ orders (1:N) ──────────────────────────────────────┤→ products
       │    ├─ order_items (1:N)                              │
       │    ├─ payments (1:N — one row per payment attempt)    │
       │    ├─ shipments (1:N)                                 │
       │    ├─ returns (1:1 per order) ── return_items (1:N)   │
       │    └─ discount_redemptions (1:N)                      │
       ├─ reviews (1:N) ── review_images (1:N)                 │
       ├─ product_questions (1:N) ── product_answers (1:1)     │
       └─ admin_audit_logs (1:N, as the acting user)           │
                                                                 │
categories ── product_categories (M:N) ────────────────────────┤
collections ── collection_products (M:N) ───────────────────────┘
products
  ├─ product_variants (1:N)
  ├─ product_images (1:N, optionally scoped to a variant)
  └─ inventory (1:N — one row per product×variant×location)

discount_codes ── discount_redemptions (1:N)

homepage_sections, hero_slides, journal_posts   — standalone, admin-managed
store_settings                                   — singleton (boolean PK, exactly one row, ever)
media_assets                                      — standalone, references storage objects
newsletter_subscribers, contact_submissions       — standalone, public-writable
role_permissions                                  — reference table (role × permission), not admin-managed
```

Every foreign key's `ON DELETE` behavior was chosen deliberately, not
defaulted:

- **CASCADE** where the child has no meaning without the parent (cart_items,
  order line-level data owned entirely by its order, product_images,
  product_variants, review_images, wishlist_items, junction tables).
- **SET NULL** where history must survive the parent's removal — an order
  keeps existing if the customer account, product, or staff member who
  touched it is later deleted (`orders.user_id`, `order_items.product_id`,
  `payments`/`reviews`/`admin_audit_logs`'s various `*_id` references).
- **RESTRICT-by-omission**: categories/collections/discount_codes have no
  cascading delete path from products — the admin API layer checks first
  and refuses (matching the existing in-memory stores' behavior) rather than
  silently orphaning references.

## Every RLS policy

All 35 tables (plus the internal `role_permissions` reference table) have
`ENABLE ROW LEVEL SECURITY`. Grouped by pattern rather than listed 100+
times identically — the migration file after each heading has the literal
`CREATE POLICY` statements.

**Public read / staff write** (categories, collections, products,
product_variants, product_images, product_categories, collection_products,
homepage_sections, hero_slides, journal_posts, discount_codes) —
`0002_catalog.sql`, `0005_promotions.sql`, `0007_site_content.sql`:
- `..._select_public`: anon + authenticated may `SELECT` published/active/
  non-deleted rows only.
- `..._select_staff`: the resource's `:view` permission sees everything,
  including drafts (the "preview before publish" path).
- `..._write_staff` / `_update_staff` / `_delete_staff`: the resource's
  `:write` permission.

**Owner-only** (addresses, carts, cart_items, wishlists, wishlist_items) —
`0001_identity_and_access.sql`, `0003_carts_and_wishlists.sql`:
- `..._all_own`: `user_id = auth.uid()` (or a join to the owning row) for
  `ALL` (select/insert/update/delete). No anon policy anywhere in this
  group — a guest cart/wishlist is handled by a Route Handler using the
  service-role client instead (RLS can't verify an anonymous session_id).
- `addresses_select_staff`: read-only, `customers:view`.

**profiles** — `0001_identity_and_access.sql`:
- `profiles_select_own`, `profiles_update_own`: self.
- `profiles_select_staff` (`customers:view` or `team:view`),
  `profiles_update_staff` (`customers:write` or `team:write`).
- No insert/delete policy — rows are created only by `handle_new_user()`
  and removed only via `auth.users` cascade.
- `role`/`is_disabled`/`disabled_reason` are additionally guarded by the
  `guard_profile_update` trigger (see [Security decisions](#security-decisions)).

**user_roles / role_permissions** — `0001_identity_and_access.sql`:
- `user_roles_all_team_write`: `team:write` only (super_admin, plus
  store_admin is explicitly excluded from this one permission).
- `role_permissions_select_all`: read-only for everyone (it's the same
  matrix already public in the client bundle).

**orders** — `0004_orders_payments_shipments.sql`:
- `orders_select_own` (`user_id = auth.uid()`), `orders_select_staff`
  (`orders:view`), `orders_update_staff` (`orders:fulfil`).
- No insert/delete policy at all — creation is service-role only.
- Column GRANT restricts `authenticated` UPDATE to the operational columns
  only (`status`, tracking, `cancelled_reason`, refund fields) — every
  financial column is unreachable by any `authenticated` write.

**order_items** — `0004_orders_payments_shipments.sql`:
- `order_items_select_own`, `order_items_select_staff` (`orders:view`).
- No insert/update/delete policy for anon/authenticated — fully immutable
  after creation.

**payments** — `0004_orders_payments_shipments.sql`:
- `payments_select_own`, `payments_select_staff` (`orders:view`).
- Column GRANT limits `authenticated` SELECT to
  `id, order_id, provider, provider_reference, status, amount, currency,
  created_at, updated_at` — `raw_response` and the webhook dedupe key are
  never exposed.
- No insert/update/delete policy for anon/authenticated at all — service-
  role only.

**shipments** — `0004_orders_payments_shipments.sql`:
- `shipments_select_own`, `shipments_all_staff` (`orders:fulfil`).

**discount_redemptions** — `0005_promotions.sql`:
- `discount_redemptions_select_own`, `_select_staff` (`promotions:view`).
- No insert/update/delete policy — only `redeem_discount_code()` writes.

**reviews** — `0006_reviews_and_qa.sql`:
- `reviews_select_published` (public), `reviews_select_own`,
  `reviews_select_staff` (`content:view`).
- `reviews_insert_own` (`user_id = auth.uid()`), `reviews_update` (own row
  or `content:write`), `reviews_delete` (own row or `content:write`).
- The `guard_review_write` trigger forces new rows to `status = 'pending'`
  and blocks a non-staff status change, regardless of row policy.

**review_images** — mirrors its parent review's visibility; insert/delete
by the owning review's author or `content:write`.

**product_questions / product_answers** — `0006_reviews_and_qa.sql`:
- Questions: public sees `published`; own row always visible; `content:view`
  sees all; insert own; moderate (`content:write`).
- Answers: visible wherever the parent question is; write is
  `content:write`-only (staff-authored).

**store_settings** — `0007_site_content.sql`:
- `store_settings_select_all`: anon + authenticated, unconditionally (see
  [Security decisions](#security-decisions) for why).
- `store_settings_update_staff`: `settings:write`.
- No insert/delete policy — the one row is created by the migration.

**media_assets** — `0007_site_content.sql`:
- `media_assets_select_staff` (`media:view`), `media_assets_write_staff`
  (`media:write`). Never public — the storefront only ever renders a `url`
  already embedded elsewhere.

**newsletter_subscribers / contact_submissions** — `0008_ops.sql`:
- `..._insert_open`: anon + authenticated, unconditionally (a public form).
  Column GRANT restricts which fields are actually settable (`email,
  source` / `name, email, subject, message`).
- `..._select_staff` (`customers:view`), `contact_submissions_update_staff`
  (`customers:view`).
- No direct SELECT/UPDATE for anon/authenticated — newsletter unsubscribe
  goes through the `unsubscribe_newsletter()` token RPC instead.

**returns / return_items** — `0008_ops.sql`:
- `returns_select_own`, `_select_staff` (`orders:view`), `returns_insert_own`
  (must reference the caller's own order), `returns_update` (own row or
  `orders:fulfil`). The `guard_return_write` trigger blocks a non-staff
  status change past `requested`.
- `return_items` mirrors its parent return's visibility/ownership.

**admin_audit_logs** — `0009_audit_log.sql`:
- `admin_audit_logs_select_staff` (`audit:view`).
- No insert/update/delete policy for anon/authenticated at all — only
  `log_admin_action()` writes, and nothing ever updates or deletes a row.

**Storage (`storage.objects`)** — `0010_storage.sql`:
- `product-images` / `category-images` / `content-images`: public read;
  write gated on `products:write` / `categories:write` / `content:write`.
- `review-images`: public read; write restricted to the uploader's own
  `{auth.uid()}/...` folder, or `content:write` for moderation deletes.
- `invoices`: private — read by the owning order's customer or
  `orders:view` staff; no client write path (server-generated only).
- `return-evidence`: private — read/write restricted to the owner's
  `{auth.uid()}/...` folder (plus staff read via `orders:view`, staff
  delete via `orders:fulfil`).

## Role → permission matrix

| Role | Permissions |
| --- | --- |
| `super_admin` | Every permission, including `team:write` |
| `store_admin` | Every permission except `team:write` |
| `product_manager` | `dashboard:view`, `products:*`, `categories:*`, `collections:*`, `media:*` |
| `order_fulfilment` | `dashboard:view`, `orders:view`, `orders:fulfil`, `orders:export`, `customers:view`, `products:view` |
| `content_editor` | `dashboard:view`, `content:*`, `media:*`, `categories:view` |
| `customer_support` | `dashboard:view`, `customers:view`, `customers:write`, `orders:view` (**no** `orders:fulfil` — cannot refund, cancel, or change status/tracking) |

This is a byte-for-byte mirror of `ROLE_PERMISSIONS` in
`src/lib/admin/roles.ts`, seeded as data into `role_permissions` — see
`0001_identity_and_access.sql`. If you ever change the TypeScript matrix,
update the SQL seed insert to match (there's no automatic sync between the
two; see [Security decisions](#security-decisions)).

## How to run the migrations

Requires the [Supabase CLI](https://supabase.com/docs/guides/cli) and a
Supabase project (local via `supabase start`, or a hosted one).

```bash
# Local development database (Docker):
supabase start
supabase db reset        # applies every migration in order, then runs seed.sql

# Against a hosted project you've linked with `supabase link`:
supabase db push          # applies any migrations not yet on the remote
```

Migrations are plain numbered SQL files
(`supabase/migrations/20250101000000_extensions_and_enums.sql` through
`..._001000_storage.sql`) — `supabase db push`/`db reset` apply them in
filename order, which is also dependency order (extensions and enums
before tables; identity/access before everything that references
`profiles`; catalog before carts/orders; orders before payments/shipments;
and so on). Re-running against a database that already has them applied is
a no-op — the CLI tracks which migrations have already run.

If you don't have the CLI available, every file is also just SQL: open the
Supabase Dashboard's SQL Editor and run each migration file's contents in
the same numeric order, once each.

**One manual step outside the migrations**: set
`ADMIN_BOOTSTRAP_EMAILS` (see `.env.local.example`) *before* your own first
sign-up, so the app grants your account `super_admin` on first login. Every
admin role after that is granted from `/admin/team` (`user_roles`,
`team:write`-gated), not through an env var.

## How to seed the database

```bash
supabase db reset          # runs migrations + supabase/seed.sql automatically
```

or, against an already-migrated database:

```bash
supabase db execute -f supabase/seed.sql
# or paste the file's contents into the Dashboard's SQL Editor
```

`seed.sql` populates exactly the storefront-facing data a fresh environment
needs: 6 categories, 4 collections, 22 products (with variants, images, and
per-product inventory — two intentionally low-stock, one intentionally
out-of-stock, so the admin dashboard's widgets have something to show), 12
homepage sections, 3 hero slides, the store settings row, and 10 sample
reviews across a handful of products. It does **not** seed `profiles`,
`orders`, `carts`, or `wishlists` — those all key off a real
`auth.users.id`, and fabricating one bypasses Supabase Auth entirely
without producing anything you could actually sign in as. Create a real
account through the app's own sign-up flow instead. No row in the seed
contains real customer personal information.

The seed script runs inside a single `BEGIN`/`COMMIT`, so a failure partway
through leaves the database untouched rather than half-seeded.

## Storage buckets

Created by `0010_storage.sql`, not the Dashboard UI — six buckets, each
with a file-size limit and a MIME-type allowlist enforced at the bucket
level (independent of whatever the client-side uploader already checks):

| Bucket | Public | Limit | Allowed types |
| --- | --- | --- | --- |
| `product-images` | Yes | 5 MB | jpeg, png, webp, gif, svg |
| `category-images` | Yes | 5 MB | jpeg, png, webp, gif, svg |
| `content-images` | Yes | 5 MB | jpeg, png, webp, gif, svg |
| `review-images` | Yes | 5 MB | jpeg, png, webp, gif |
| `invoices` | No | 10 MB | pdf |
| `return-evidence` | No | 5 MB | jpeg, png, webp, gif |

Path convention (enforced by `storage.objects` RLS, not just documented):
`product-images/{product_id}/{filename}`,
`category-images/{category_id}/{filename}`,
`content-images/{context}/{filename}`,
`review-images/{user_id}/{review_id}/{filename}`,
`invoices/{order_id}/{filename}`,
`return-evidence/{user_id}/{return_id}/{filename}`.

## Environment variables

See `.env.local.example` for the full list. The three this schema adds
requirements around:

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — every
  session-aware read/write in `src/lib/db/**` (via `getDb()`).
- `SUPABASE_SERVICE_ROLE_KEY` — the handful of server-only writes that
  bypass RLS by design: order creation, payment records, discount
  redemption, audit-log writes. Never exposed to the client; see
  `src/lib/supabase/service.ts`.

## Security decisions

- **Customers cannot change product prices or order totals — structurally,
  not just by convention.** `orders.total` has a CHECK constraint
  (`total = subtotal - discount_amount + delivery_fee + tax_amount`), so no
  row can ever exist with an inconsistent total regardless of what wrote
  it. On top of that, every financial column on `orders` has its `UPDATE`
  grant revoked from `authenticated` entirely (only the operational columns
  — status, tracking, refund fields — are granted, and only staff with
  `orders:fulfil` can reach them via RLS). There is no `INSERT` policy on
  `orders`, `order_items`, or `payments` for `anon`/`authenticated` at all —
  every one of those is written exclusively by the service-role client
  after the server has independently recomputed the total from live
  product prices.

- **Payment records are server-write-only, and their sensitive columns are
  invisible even to staff via the normal client.** `payments.raw_response`
  (the provider's webhook payload) and its internal dedupe key are excluded
  from the `authenticated` SELECT grant entirely — a customer or admin
  session can see that a payment succeeded and for how much, never the raw
  provider payload. Writing a payment record at all requires the
  service-role key.

- **A customer cannot grant themselves — or anyone — an admin role.**
  `user_roles` (the only place a role is actually granted) is gated on
  `team:write`, which only `super_admin` holds (`store_admin` is
  explicitly excluded from that one permission). `profiles.role` itself is
  a read-only cache: the `guard_profile_update` trigger raises an exception
  if a client tries to change it directly, regardless of RLS, because
  Supabase gives every signed-in user — customer or admin alike — the same
  Postgres `authenticated` role, so a column-level `GRANT` can't tell them
  apart the way it can tell `anon` from `authenticated`. A row-aware
  trigger can, and does. The same trigger blocks a non-`customers:write`
  session from toggling `is_disabled`/`disabled_reason`. A separate trigger
  on `user_roles` blocks a super_admin from changing their own role row, so
  self-demotion always requires a second admin.

- **Product managers can manage products; they cannot touch admin
  permissions.** `product_manager`'s `role_permissions` rows never include
  `team:view`/`team:write` — there is no policy path from that role to
  `user_roles` at all, so this is enforced identically whether the request
  comes through the app's UI or a raw API call.

- **Content editors can manage site content; they cannot see or touch
  orders or payments.** `content_editor` holds `content:*`/`media:*` and
  nothing from the `orders:*`/`promotions:*` family — `orders_select_staff`,
  `payments_select_staff`, etc. simply never evaluate true for that role.

- **Support staff can view orders but cannot refund.** `customer_support`
  holds `orders:view` but deliberately not `orders:fulfil` — refunds,
  cancellations, status changes, and tracking updates all require
  `orders:fulfil` in both the RLS policies here and the existing
  `/api/admin/orders/**` route checks, so this isn't a gap between the two
  layers.

- **Every admin action is logged, and the log can't be forged or edited.**
  `admin_audit_logs` has no `INSERT` policy for `anon`/`authenticated` at
  all — the only way a row is created is `log_admin_action()`, a
  `SECURITY DEFINER` function that fills in `user_id`/`user_email` from
  `auth.uid()` itself, never a caller-supplied value. There is no `UPDATE`
  or `DELETE` policy on the table, ever, for any role short of the database
  owner — an audit trail that could be quietly edited after the fact
  wouldn't be one.

- **A shared wishlist link can't be used to browse other people's
  wishlists.** There's no RLS policy granting `SELECT` on `wishlists` by
  `share_token` — a "select where share_token is not null" policy would let
  anyone enumerate every shared wishlist's contents, not just the one they
  hold a link to. Instead, `get_wishlist_by_share_token()` is the only
  read path: it takes an exact, unguessable 128-bit token and returns
  precisely that one wishlist's items, with no way to list or search.
  Newsletter unsubscribe-by-link uses the identical pattern
  (`unsubscribe_newsletter()`).

- **A usage-limited discount code can't be oversold by a race condition.**
  `redeem_discount_code()` takes `FOR UPDATE` on the code's row before
  checking `times_used < usage_limit`, so two concurrent checkouts
  redeeming the last unit of a limited code serialize instead of both
  succeeding — the second transaction's check runs only after the first
  has committed its increment. `discount_redemptions` itself has no direct
  `INSERT` policy; this function is the only writer.

- **Every `SECURITY DEFINER` function sets `search_path` explicitly.**
  (`current_app_role()`, `has_permission()`, `sync_profile_role()`,
  `redeem_discount_code()`, `log_admin_action()`, `handle_new_user()`, and
  the rest.) A `SECURITY DEFINER` function that trusts the caller's
  `search_path` is a well-known privilege-escalation vector (a malicious
  session could shadow an unqualified table/function name); every one here
  pins `search_path = public, pg_temp` instead.

- **RLS helper functions don't recurse into their own policies.**
  `current_app_role()`/`has_permission()` read `profiles`/`role_permissions`
  directly, and both tables are owned by the migration role — Postgres
  never applies RLS to a table's owner, so these SECURITY DEFINER functions
  read those tables without triggering the very policies that call them.

- **Custom trigger guards exempt trusted server contexts, deliberately.**
  RLS itself already never applies to a role with `BYPASSRLS`
  (`service_role` in a real project, `postgres` locally) — but a plain
  `BEFORE INSERT/UPDATE` trigger fires for *every* role regardless, with no
  automatic equivalent bypass. `is_trusted_context()` checks
  `pg_roles.rolbypassrls`/`rolsuper` for the current role and lets
  `guard_profile_update`, `guard_review_write`, and `guard_return_write`
  return early for it — otherwise the checkout flow, an import script, or
  this repo's own migrations/seed (which don't have a `auth.uid()` session
  to satisfy `has_permission()` checks) would be blocked by rules meant for
  ordinary customer/staff sessions, not the server acting deliberately.
  This was caught by actually running the migrations and seed against a
  real Postgres instance during development, not just read — see the
  commit history for the specific failure it fixed.

- **Store settings has no secrets, so it's the one fully public table.**
  Nothing in `store_settings` is a credential — payment/email provider API
  keys live in server-only environment variables
  (`src/lib/payments/providers/*.ts`), never in this table — so the whole
  row is publicly readable and only `settings:write` can change it, rather
  than maintaining a public/staff-only column split for negligible benefit.

- **The role/permission matrix is data, not code, and it's the same data
  in two places on purpose.** `role_permissions` is a table, seeded from
  the exact same list as `ROLE_PERMISSIONS` in `src/lib/admin/roles.ts` —
  inspectable with a plain `SELECT`, and every `has_permission()` call
  (which every RLS policy in this schema goes through) reads it live. There
  is no automatic sync between the TypeScript copy and the SQL copy; changing
  one without the other is a real drift risk worth a lint/test in a real
  deployment, flagged here rather than silently assumed away.

## Relationship to the in-memory stores

Every `src/lib/admin/*-store.ts`, `src/lib/orders/store.ts`, and
`src/lib/account/*-store.ts` module already documents, in its own header
comment, the real table this schema now defines for it. The swap-over path
is: replace each store function's body with the matching `src/lib/db/**`
call (or add one following the same pattern for a resource not yet
covered), leaving every call site — API routes, Server Components —
unchanged, since the function signatures were written to match 1:1. This
schema, its RLS, and `src/lib/db/**`'s error handling are the complete,
ready-to-run target for that swap; only `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and running the migrations stand between
this environment and actually doing it.
