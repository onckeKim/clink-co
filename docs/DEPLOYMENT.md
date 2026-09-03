# Deployment guide — Vercel + Supabase

This is the operational guide for taking Clink & Co from this repository to
a live, production URL. It assumes the reader has a Vercel account, a
Supabase account, and access to whichever payment/email providers the
business has chosen — it does not assume familiarity with this codebase.

For what each environment variable does and where its value comes from,
see **[`.env.local.example`](../.env.local.example)** — this guide tells you
*when* and *where* to set them, not what each one means (that file already
documents that in full, per variable).

> **Read this first:** the storefront and admin dashboard currently run on
> **in-memory data stores**, not the Supabase database — see
> [Known limitation: the commerce data isn't in Supabase yet](#known-limitation-the-commerce-data-isnt-in-supabase-yet)
> before you plan a launch date. Auth, and only auth, is already wired to
> real Supabase.

---

## Contents

1. [Order of operations](#order-of-operations)
2. [1 — Create and configure the Supabase project](#1--create-and-configure-the-supabase-project)
3. [2 — Database migrations](#2--database-migrations)
4. [3 — Seed data](#3--seed-data)
5. [4 — Deploy to Vercel](#4--deploy-to-vercel)
6. [5 — Environment variables](#5--environment-variables)
7. [6 — Custom domain, DNS & HTTPS](#6--custom-domain-dns--https)
8. [7 — Webhook deployment](#7--webhook-deployment)
9. [8 — Email domain verification](#8--email-domain-verification)
10. [9 — Payment provider configuration](#9--payment-provider-configuration)
11. [10 — Cron jobs](#10--cron-jobs)
12. [Backup and recovery](#backup-and-recovery)
13. [Rollback procedure](#rollback-procedure)
14. [Error monitoring structure](#error-monitoring-structure)
15. [Logging structure](#logging-structure)
16. [Uptime monitoring recommendations](#uptime-monitoring-recommendations)
17. [Known limitation: the commerce data isn't in Supabase yet](#known-limitation-the-commerce-data-isnt-in-supabase-yet)

---

## Order of operations

Do these in order — later steps assume earlier ones are done:

1. Create the Supabase project (§1).
2. Run migrations against it (§2).
3. Seed it (§3).
4. Create the Vercel project from this repo (§4).
5. Set every environment variable on Vercel (§5).
6. Attach the custom domain and wait for DNS + HTTPS to settle (§6).
7. Point each payment provider's webhook URL at the live domain (§7).
8. Verify the sending domain with the email provider (§8).
9. Add real payment credentials, flip sandbox flags off (§9).
10. Point the cron scheduler at the live domain (§10).
11. Work through **[GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)**.

---

## 1 — Create and configure the Supabase project

1. [supabase.com](https://supabase.com) → New project. Pick a region close
   to your customers (South Africa has no native Supabase region as of
   writing — `eu-west-1` or `eu-central-1` are the closest).
2. **Project Settings → API**: copy the **Project URL** and **anon public**
   key — these become `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. **Project Settings → API → Project API keys**: copy the
   **service_role** key — this becomes `SUPABASE_SERVICE_ROLE_KEY`. Treat it
   like a root password: server-only, never in a client bundle, never in a
   PR, never in a support ticket.
4. **Authentication → URL Configuration**: set the **Site URL** to your
   production domain (e.g. `https://clinkandco.com`) once you know it, and
   add `https://clinkandco.com/**` (and the Vercel preview-deployment
   pattern, `https://*.vercel.app/**`, while you're still testing) to
   **Redirect URLs** — this is what makes Supabase's verification/recovery
   email links land back on this app instead of erroring.
5. **Authentication → Email Templates**: customize the confirmation and
   recovery templates to point at this app's own pages
   (`/auth/confirm`, `/reset-password`) — the README's
   [Sign-up, verification, login](../README.md#sign-up-verification-login)
   section has the exact template changes.

## 2 — Database migrations

The full schema (35 tables, RLS, storage buckets) lives in `supabase/` and
is written to run as-is. Follow
**[supabase/README.md § How to run the migrations](../supabase/README.md#how-to-run-the-migrations)**
exactly — it covers both the Supabase CLI (`supabase link` +
`supabase db push`) and pasting the SQL directly into the Dashboard's SQL
Editor, in the correct file order.

## 3 — Seed data

`supabase/seed.sql` seeds baseline reference data (categories, store
settings, etc.) — see
**[supabase/README.md § How to seed the database](../supabase/README.md#how-to-seed-the-database)**.
This is *not* the same as the demo product catalogue currently shown on the
storefront (`src/data/*-seed.ts`) — see the [known limitation](#known-limitation-the-commerce-data-isnt-in-supabase-yet)
below for why those two are still separate.

## 4 — Deploy to Vercel

1. [vercel.com/new](https://vercel.com/new) → import this Git repository.
2. Framework preset: **Next.js** (auto-detected). Build command
   (`next build`), output directory, and install command can all stay at
   their Vercel defaults — this repo needs no custom build configuration.
3. Node.js version: 20.x or later (matches `@types/node ^22` in
   `package.json` and this repo's local dev environment).
4. Don't hit **Deploy** yet — set environment variables first (§5), or the
   first build will succeed (Supabase calls are all inside request
   handlers, not at build time) but every page that touches auth will
   error at runtime until they're set.
5. **Project Settings → Git**: confirm the production branch (typically
   `main`) and that preview deployments are enabled for PRs if your team
   wants them — every preview deployment gets its own `*.vercel.app` URL
   and shares the same Supabase project unless you deliberately create a
   second one for staging.

## 5 — Environment variables

**Vercel → Project → Settings → Environment Variables.** Add every variable
from `.env.local.example` that has a real value for this deployment,
scoped to **Production** (and to **Preview** too, for any preview
deployments you want fully functional — most teams point previews at the
same Supabase project as production for a small store like this, but a
second Supabase project for previews avoids preview traffic ever touching
real customer data).

Minimum required for a functioning production deploy:

| Variable | Required for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auth to work at all |
| `NEXT_PUBLIC_SITE_URL` | Correct canonical URLs, OG tags, auth redirect URLs |
| `ADMIN_BOOTSTRAP_EMAILS` | Creating the first admin account (see [Go-live checklist](./GO_LIVE_CHECKLIST.md)) |
| At least one payment provider's vars, `EFT_ENABLED=true`, or `ENABLE_TEST_PAYMENTS=true` | Checkout to have any payment method to offer at all |
| `EMAIL_UNSUBSCRIBE_SECRET`, `CRON_SECRET` | Marketing emails and the abandoned-cart cron to be safe to turn on |

Everything else (email provider, analytics, WhatsApp) is opt-in — leaving
it unset disables that integration cleanly, it doesn't break the build.

After setting variables, trigger a redeploy (Vercel doesn't retroactively
apply env var changes to an already-built deployment).

## 6 — Custom domain, DNS & HTTPS

1. **Vercel → Project → Settings → Domains** → add your domain
   (`clinkandco.com`) and, if you want it, `www.clinkandco.com`.
2. Vercel shows the exact DNS records to add. For an apex domain
   (`clinkandco.com`), that's typically an **A record** to Vercel's anycast
   IP (`76.76.21.21`) or, if your DNS provider supports it, an **ALIAS/ANAME**
   record pointed at `cname.vercel-dns.com`. For a subdomain
   (`www.clinkandco.com`), it's a **CNAME** to `cname.vercel-dns.com`.
   Add those records at whichever provider hosts your DNS (your domain
   registrar, or Cloudflare/Route53/etc. if you've delegated DNS there).
3. Decide the canonical host and redirect the other: in the same Domains
   panel, set either the apex or the `www` subdomain as primary — Vercel
   auto-redirects the other to it. Update `NEXT_PUBLIC_SITE_URL` and the
   Supabase **Site URL** (§1.4) to match whichever you chose as canonical.
4. **HTTPS is automatic** — Vercel provisions and renews a Let's Encrypt
   certificate for every verified domain, no action needed. DNS
   propagation is typically minutes but can take up to ~48 hours
   depending on your registrar's TTL; the domain shows "Valid
   Configuration" in the Vercel dashboard once it's live.
5. Re-run through §1.4 (Supabase redirect URLs) with the final domain
   before removing the `*.vercel.app` fallback from that allow-list.

## 7 — Webhook deployment

Every payment provider needs its webhook/"ITN"/"notify" URL pointed at:

```
https://<your-domain>/api/webhooks/payments/<provider>
```

where `<provider>` is `payfast`, `peach`, `yoco`, or `ozow` (`eft` and
`test` don't use gateway webhooks — EFT is manually reconciled, and `test`
is called from the in-app payment simulator, not a real gateway). Set each
URL in that provider's own dashboard (see
[§9](#9--payment-provider-configuration) for exactly where). There is
nothing to configure on the Vercel/Next.js side beyond the app already
being deployed and reachable — these are plain HTTPS API routes, not a
separate service.

Before relying on a webhook in production, trigger one real test event
from the provider's dashboard (most have a "send test webhook" button) and
confirm it reaches `/api/webhooks/payments/<provider>` with a `200`
response — check the [logging structure](#logging-structure) section for
where that shows up.

## 8 — Email domain verification

Transactional email (order confirmations, password resets, etc. — see
`src/lib/email.ts`) sends through whichever provider `EMAIL_PROVIDER` is
set to. Each requires verifying the sending domain before it will deliver
to real inboxes reliably (unverified sends often land in spam or get
rejected outright):

- **Resend**: Dashboard → Domains → Add Domain → add the shown SPF (a
  `TXT`/`MX` record) and DKIM (`TXT` `resend._domainkey`) records at your
  DNS provider → wait for Resend to show the domain as **Verified**
  (usually minutes). Send from an address on that domain, e.g.
  `orders@clinkandco.com`, matching `emailSenderLocalPart` /
  `businessName` in store settings.
- **SendGrid**: Settings → Sender Authentication → Authenticate Your
  Domain → add the shown `CNAME` records → verify. Also complete **Sender
  Identity** (single sender or full domain auth) before sending.
- **Postmark**: Sender Signatures (single address) or Domains (full
  domain, recommended) → add the shown DKIM `TXT` and Return-Path `CNAME`
  records → verify. Postmark also requires requesting your server be moved
  out of its default sandbox/trial sending limits before high-volume
  production sending.
- Add a **DMARC** `TXT` record at `_dmarc.<yourdomain>` regardless of
  provider (`v=DMARC1; p=none; rua=mailto:you@yourdomain.com` is a safe
  starting policy) — not required by any provider above, but meaningfully
  improves inbox placement and is checked by receiving mail servers
  alongside SPF/DKIM.
- Until a provider is configured, every email is logged to the console and
  saved to a local file instead of sent — see
  [`src/lib/email/README.md`](../src/lib/email/README.md). That's fine for
  every environment except the live production domain.

## 9 — Payment provider configuration

See the README's
**[Required payment credentials](../README.md#required-payment-credentials)**
table for exactly which env vars each provider needs and where to find
them, and
**[Test vs. production settings](../README.md#test-vs-production-settings)**
for the sandbox → live switch-over per provider. One item that table
doesn't cover: where to paste the webhook URL from §7 —

| Provider | Webhook URL field |
| --- | --- |
| PayFast | Merchant Dashboard → Settings → Integration → **Notify URL** |
| Peach Payments | Dashboard → Checkout API → **Webhook/Notification URL** |
| Yoco | Portal → Online → Webhooks → **Add Webhook** (subscribe to the checkout/payment events) |
| Ozow | Business Portal → Settings → API → **Notify URL** |

**Before going live**, run at least one real transaction through each
enabled provider's own sandbox with the sandbox flag still on, confirm the
webhook fires and the order reaches `paid`, *then* switch to production
credentials — these integrations are implemented from each provider's
public docs but have not been verified against a live merchant account
(see the README note linked above).

## 10 — Cron jobs

The abandoned-cart email workflow (`/api/cron/abandoned-cart-emails`)
needs something to call it on a schedule — Vercel doesn't run cron jobs
automatically unless you declare one. Add a `vercel.json` at the repo root:

```json
{
  "crons": [{ "path": "/api/cron/abandoned-cart-emails", "schedule": "0 * * * *" }]
}
```

This runs hourly; adjust to taste. Vercel Cron calls the route with an
`Authorization: Bearer <CRON_SECRET>` header automatically when
`CRON_SECRET` is set as a project env var — no extra wiring needed on this
app's side (see `src/lib/email/cron-auth.ts`). Vercel Cron requires a Pro
plan or higher; on the Hobby plan, use an external scheduler (e.g.
[cron-job.org](https://cron-job.org) or GitHub Actions' `schedule` trigger)
pointed at the same URL with the same header instead.

Also enable `abandonedCartEnabled` in store settings (`/admin/settings`)
once this is wired up — the cron route no-ops while it's off.

---

## Backup and recovery

- **Database**: Supabase takes automatic daily backups on paid plans
  (retention varies by plan — check **Project Settings → Backups** for
  your project's actual window) and offers Point-in-Time Recovery (PITR)
  as an add-on for finer-grained restores. On the free tier, there are
  **no automatic backups** — for a real store, upgrade before launch, or
  set up your own scheduled `pg_dump` (Supabase exposes a direct Postgres
  connection string under **Project Settings → Database** for this).
- **Before every migration or bulk data change**: take a manual backup
  first (**Project Settings → Backups → Create backup** on paid plans, or
  `pg_dump` on any plan) — migrations in `supabase/migrations/` are
  additive by design (see `supabase/README.md`) but a manual safety net
  before running SQL against production is standard practice regardless.
- **Storage buckets** (product images, etc.): Supabase Storage isn't
  covered by the database's PITR — back up buckets separately (e.g. a
  scheduled job syncing to S3/GCS, or Supabase's own storage export) if
  the images aren't otherwise recoverable from a source of truth (a DAM,
  the original photography files, etc.).
- **Code**: Git is the backup for the application itself — Vercel deploys
  are immutable and individually addressable (see
  [Rollback procedure](#rollback-procedure)), so there's no separate code
  backup to maintain beyond normal Git hygiene (protected `main`, no
  force-pushes).
- **Recovery drill**: before relying on any of the above during a real
  incident, actually restore a backup into a scratch Supabase project once
  and confirm the app runs against it — an untested backup is a hope, not
  a plan.

## Rollback procedure

**Application code** — Vercel keeps every deployment; rolling back doesn't
require a revert commit or a new build:

1. **Vercel → Project → Deployments** → find the last known-good
   deployment → **⋯ → Promote to Production**. This re-points the
   production domain at that build instantly (no rebuild).
2. Separately, revert the bad commit in Git (`git revert`) so the next
   push doesn't reintroduce it — the Vercel rollback alone doesn't change
   what's on `main`.

**Database migrations** — this schema has no down-migrations by design
(see `supabase/README.md`'s migration philosophy); rolling back a bad
schema change means either:
- Restoring the pre-migration backup you took per the [backup
  section](#backup-and-recovery) above (data-loss for anything written
  after that backup — hence "take a backup before every migration"), or
- Writing and applying a new, forward-only migration that undoes the
  specific change (preferred when the bad migration didn't lose data,
  since it doesn't sacrifice everything written since).

**A single bad payment-provider credential or config value** doesn't need
a full rollback — fix the env var in Vercel and redeploy (or just
redeploy if the fix is env-only, since env var changes need a redeploy to
take effect per [§5](#5--environment-variables)).

## Error monitoring structure

There is no error-tracking SDK wired into this codebase today (no Sentry,
Bugsnag, etc.) — this is the recommended structure to add one, not a
description of something already running:

1. Pick a provider (Sentry has first-class Next.js support via
   `@sentry/nextjs` and is the most common default for this stack).
2. Install and run its setup wizard (`npx @sentry/wizard@latest -i
   nextjs`), which generates `sentry.client.config.ts`,
   `sentry.server.config.ts`, and `sentry.edge.config.ts` and wires
   `next.config.ts` automatically — this repo's existing `next.config.ts`
   customizations (headers, image config) are plain object exports the
   wizard's wrapper is designed to sit around, so they should survive
   unedited.
3. Set `SENTRY_DSN` (and `SENTRY_AUTH_TOKEN` for source-map upload at
   build time) as Vercel env vars.
4. At minimum, confirm errors are captured from: API route handlers
   (uncaught exceptions in `src/app/api/**/route.ts`), the payment webhook
   handler specifically (a silent failure there means a customer paid and
   the order never updates — this route deserves its own alert rule, not
   just "part of the general error stream"), and client-side React error
   boundaries.
5. Until this is added, the only error visibility is Vercel's own build
   and runtime logs (see [Logging structure](#logging-structure)) —
   sufficient to notice a fire, not to be paged for one.

## Logging structure

- **Where logs go today**: every `console.log`/`console.error` in a route
  handler or Server Component lands in **Vercel → Project → Logs**
  (formerly "Runtime Logs"), searchable and filterable by route/status/time
  for a rolling retention window that depends on your Vercel plan (longer
  on Pro than Hobby). There's no separate logging library in this codebase
  — it's plain `console.*`, which Vercel already captures without any
  extra setup.
- **What's worth searching for post-launch**:
  - Failed webhook verifications (`parseWebhook` returning `null` — see
    `src/app/api/webhooks/payments/[provider]/route.ts`) — a spike here
    means either a real attack or a misconfigured secret, and either way
    it means a customer's payment status silently isn't updating.
  - `429` responses (rate-limit hits — `src/lib/rate-limit.ts` is
    in-memory per the file's own header comment, so a spike is either
    real abuse or a signal that the limits are too tight for real
    traffic).
  - `401`/`403` responses on `/api/admin/**` outside expected admin usage
    — see [Security hardening](#) in the main QA pass for the access-
    control tests this maps to.
- **For anything beyond Vercel's built-in log retention/search**: pipe logs
  to a dedicated platform via **Vercel → Project → Settings →
  Integrations** (Datadog, Logtail/Better Stack, Axiom, and others all
  have one-click log-drain integrations) — recommended before launch if
  the business needs logs retained longer than Vercel's default window or
  wants alerting on log patterns (e.g. "page me if webhook verification
  fails 5 times in a minute").

## Uptime monitoring recommendations

Nothing is configured today. Recommended, in order of value for the
lowest setup cost:

1. An external uptime checker (UptimeRobot, Better Stack, Pingdom, or
   Vercel's own **Monitoring** tab on paid plans) hitting the homepage
   (`/`) every 1–5 minutes from outside Vercel's own network — this is
   the only way to know the site is down *from a real visitor's
   perspective*, since Vercel's own dashboard can look fine while DNS,
   the domain's TLS cert, or a CDN edge is actually broken for the
   outside world.
2. A second check specifically against `/api/payments/methods` (or
   another cheap, always-should-succeed API route) — catches a broken
   deployment where static pages still serve from cache but every API
   route (and therefore checkout) is silently failing, which a homepage-
   only check would miss.
3. Alert routing: at minimum email; Slack/PagerDuty/OpsGenie integration
   if there's an on-call rotation. Set the alert threshold to 2+
   consecutive failures before paging — a single blip is usually a false
   positive from the checker's own network, not a real outage.
4. Once the [error monitoring](#error-monitoring-structure) SDK is added,
   most of these providers also support a status-page product
   (UptimeRobot and Better Stack both do) worth standing up publicly once
   the store has real customers who'd want to check it during an
   incident.

---

## Known limitation: the commerce data isn't in Supabase yet

**This is the single most important thing to understand before scheduling
a launch.** Products, categories, collections, coupons, orders, customers,
media, and site content all currently live in **in-memory TypeScript
stores** (`src/lib/admin/*-store.ts`, `src/lib/orders/store.ts`,
`src/lib/account/*-store.ts`), seeded once from `src/data/*-seed.ts` when
the server process starts. Only **authentication** (Supabase Auth) is
wired to the real Supabase project set up in §1.

In production on Vercel, this means:

- **Every admin edit — a new product, a stock update, a coupon, a
  fulfilled order — is lost the moment the serverless function cold-starts
  again**, which happens routinely (new deploys, scaled-to-zero
  instances waking up, and Vercel can run multiple instances
  simultaneously that each hold their own separate copy of this "database").
- **Orders placed by real customers are not durably stored.** A customer
  could complete checkout, receive a confirmation email, and have that
  order vanish from the admin dashboard on the next cold start.
- The full replacement schema, RLS policies, and a matching
  `src/lib/db/**` data-access layer already exist and are ready to run
  (§2–§3 above) — what's not done is **rewiring each in-memory store's
  functions to call that layer instead**. Every store file documents,
  in its own header comment, exactly which real table it's standing in
  for, and function signatures were deliberately written to match the
  future Supabase-backed versions 1:1 so call sites (API routes, Server
  Components) don't need to change — see
  [supabase/README.md § Relationship to the in-memory stores](../supabase/README.md#relationship-to-the-in-memory-stores).

**Do not launch real commerce traffic against this deployment until that
rewiring is done.** It's appropriate as-is for a staging/demo deployment,
an internal review, or a design/UX walkthrough with stakeholders — not for
taking real orders. Budget this as its own project phase; it touches every
admin CRUD route and the checkout/webhook flow, and deserves the same
testing rigor (unit + E2E + security) already applied elsewhere in this
codebase.
