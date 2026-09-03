# Transactional emails

Branded, mobile-responsive HTML + plain-text email templates, a
provider-neutral send service (Resend, SendGrid, Postmark, or a local
console/file fallback), retry with backoff, an event log, a local preview
UI, and a configurable abandoned-cart workflow.

## Contents

```
src/lib/email/
├── types.ts                Provider-neutral message/result types
├── layout.ts                The branded HTML shell + matching plain-text wrapper
├── components.ts             Reusable content blocks (button, order table, address, product tile, ...)
├── send.ts                   sendTransactionalEmail() — retry + logging, the one entry point
├── unsubscribe.ts             Signs/verifies one-click unsubscribe tokens
├── cron-auth.ts                Shared-secret auth for /api/cron/** routes
├── abandoned-cart.ts           The configurable abandoned-cart workflow
├── providers/
│   ├── resend.ts, sendgrid.ts, postmark.ts   Real provider adapters
│   ├── console.ts                             Dev fallback — logs + writes a local preview file
│   └── index.ts                                getEmailProvider() — the provider-neutral switch
└── templates/
    ├── customer-account.ts       welcome, email-verification, password-reset
    ├── customer-orders.ts        order-confirmation through refund-processed (9 templates)
    ├── customer-returns.ts       return-request-received, return-approved, return-rejected
    ├── customer-engagement.ts    back-in-stock, wishlist-reminder, abandoned-cart, review-request
    ├── admin.ts                  All 7 staff-facing templates
    └── registry.ts                Catalog of all 26, with sample data — powers /dev/emails

src/lib/email.ts                  Thin wrappers pairing each template with sendTransactionalEmail() —
                                    every API route in the app calls a function from here, never a
                                    template or the send service directly.
src/lib/admin/email-log-store.ts  The event log every send is recorded to.
src/lib/whatsapp/                 A separate, dormant scaffold — see its own README.
src/app/dev/emails/                Local preview UI (development only).
src/app/unsubscribe/                One-click unsubscribe landing page.
src/app/api/cron/abandoned-cart-emails/   The abandoned-cart cron trigger.
```

## Available templates

### Customer (19)

| Template key | Subject | Trigger |
| --- | --- | --- |
| `welcome` | Welcome to Clink & Co | Ready to call — no dedicated "welcome" moment wired yet; call from wherever post-signup onboarding lands |
| `email-verification` | Confirm your email address | Ready — see the note on Supabase Auth integration below |
| `password-reset` | Reset your password | Ready — see the note on Supabase Auth integration below |
| `order-confirmation` | Order confirmed — `{orderNumber}` | Order placed — `POST /api/checkout` |
| `payment-received` | Payment received — `{orderNumber}` | Payment clears — the payment webhook, or an admin status override to `paid` |
| `payment-failed` | We couldn't process your payment | Payment fails — the payment webhook |
| `order-processing` | Your order is being prepared | Not yet triggered — no discrete "processing" order status exists yet (see `src/lib/orders/types.ts`) |
| `order-packed` | Your order has been packed | Not yet triggered — same status-model gap as above |
| `order-shipped` | Your order is on its way | Admin adds tracking — `PATCH /api/admin/orders/[orderNumber]/tracking` |
| `delivery-confirmation` | Delivered — `{orderNumber}` | Admin sets status to `fulfilled` — `PATCH /api/admin/orders/[orderNumber]/status` |
| `order-cancelled` | Order cancelled — `{orderNumber}` | Admin cancels — `POST /api/admin/orders/[orderNumber]/cancel` |
| `refund-processed` | Refund processed — `{orderNumber}` | Admin records a refund — `POST /api/admin/orders/[orderNumber]/refund` |
| `return-request-received` | We've received your return request | Customer requests a return — `POST /api/account/orders/[orderNumber]/return-request` |
| `return-approved` | Your return has been approved | Not yet triggered — approving/rejecting a return has no admin action in this build yet (see `src/lib/account/returns-store.ts`) |
| `return-rejected` | An update on your return request | Same gap as `return-approved` |
| `back-in-stock` | Back in stock: `{product}` | Not yet triggered — no "notify me" subscription capture exists yet |
| `wishlist-reminder` | Your wishlist is waiting | Not yet triggered — needs a scheduled scan over wishlist data, same pattern as abandoned-cart |
| `abandoned-cart` | You left something behind | The abandoned-cart cron workflow — see below |
| `review-request` | How are you enjoying your order? | Not yet triggered — needs a scheduled scan over fulfilled orders, same pattern as abandoned-cart |

### Administrator (7)

| Template key | Subject | Trigger |
| --- | --- | --- |
| `admin-new-order` | New order: `{orderNumber}` | Order placed — `POST /api/checkout` |
| `admin-payment-failure` | Payment failed: `{orderNumber}` | Payment fails — the payment webhook |
| `admin-low-stock` | Low stock: `{product}` | A product edit crosses its low-stock threshold — `PATCH /api/admin/products/[id]` |
| `admin-out-of-stock` | Out of stock: `{product}` | A product edit takes stock to 0 — `PATCH /api/admin/products/[id]` |
| `admin-return-request` | Return requested: `{orderNumber}` | Customer requests a return — `POST /api/account/orders/[orderNumber]/return-request` |
| `admin-contact-form` | Contact form: `{subject}` | Not yet triggered — no contact form exists in this build yet to submit from |
| `admin-new-review` | New review to moderate: `{product}` | Not yet triggered — review submission (`ReviewsSection.tsx`) is currently client-only with no server persistence |

A template marked "not yet triggered" is fully built, tested via the
preview UI, and one `sendXyzEmail(...)` call away from going live in
`src/lib/email.ts` — it's waiting on a capture flow or scheduled job that's
a separate feature from "write the email," not on any more email work.

**Email verification / password reset**: Supabase Auth sends its own
built-in emails for these today (`supabase.auth.signUp()` and
`resetPasswordForEmail()`). Wiring the branded versions here means either
(a) pasting this template's HTML into the Supabase Dashboard's Auth →
Email Templates (simplest — Supabase still sends, now on-brand), or (b)
calling `supabase.auth.admin.generateLink()` server-side and sending the
result through `sendTransactionalEmail()` instead of Supabase's built-in
emailer. Neither is wired by default.

## Architecture

- **Every template** (`templates/**`) is a pure function returning
  `{ subject, previewText, html, text }` — no side effects, so every one
  is independently unit-testable and safe to render in the preview UI.
- **`layout.ts`** is the one place brand styling lives: a table-based
  HTML shell (not flexbox/grid — many email clients still don't support
  them), every style inlined, one small `<style>` block for a mobile media
  query and link colors. The brand palette is duplicated here as literal
  hex values (`COLORS`) rather than reading `src/app/globals.css`'s CSS
  custom properties, because Outlook's Word-based rendering engine ignores
  `var()` — keep the two in sync by hand if the palette changes.
- **`components.ts`** holds the reusable pieces (CTA button, order summary
  table, address block, product tile, callout box) every template
  composes from, each with a matching plain-text version.
- **`send.ts`**'s `sendTransactionalEmail()` is the only function that
  actually calls a provider. It resolves the from-address from live store
  settings, retries a transient failure (network error, 429, provider
  5xx) up to twice more with backoff — never retrying something that will
  fail identically every time (a 4xx, a missing API key) — and always
  logs the outcome (success or final failure) to the event log, whether
  or not it throws (it never does: a failed send must not fail whatever
  business action triggered it).
- **`src/lib/admin/email-log-store.ts`** is the event log — every send
  attempt, success or failure, with the provider, attempt count, and any
  error. Query it via `GET /api/admin/email-logs` (requires
  `settings:view`).
- **`src/lib/email.ts`** is the only file the rest of the app imports
  from — one `sendXyzEmail(order)`-shaped function per template, each
  pairing that template with `sendTransactionalEmail()`. An API route
  never imports a template or the send service directly.

## How to test every template safely

**Nothing here can accidentally send a real email during development or
review** — with no provider configured (the default), every attempted
send is logged to the console and written to a local
`.email-previews/*.html` file instead (gitignored). You have to
deliberately set `EMAIL_PROVIDER` (or a provider's API key) before
anything leaves the app.

1. **Visual preview, no send at all** — run `npm run dev` and open
   `http://localhost:3000/dev/emails`. Every template renders with
   fictional sample data (see `templates/registry.ts` — no real customer
   information anywhere in it); click through to see the HTML (in an
   iframe) side-by-side with the plain-text fallback, plus the exact
   subject line. This route 404s outside development, so it's never
   reachable in a deployed environment.
2. **A real send attempt, still without a real provider** — trigger the
   actual flow (place a test order, request a return, etc.) with no
   `EMAIL_PROVIDER`/API keys set. The console provider logs `[email:console]
   "..." → name <email>` and writes the rendered HTML to
   `.email-previews/<timestamp>--<subject>.html` — open that file in a
   browser to see exactly what would have gone out, with real data from
   your test action.
3. **A real send, to yourself, through a real provider** — set
   `EMAIL_PROVIDER=resend` (or `sendgrid`/`postmark`) and that provider's
   API key in `.env.local`, then set `orderNotificationEmail` and your own
   test account's email to addresses you control before triggering any
   flow. Resend and Postmark both offer a sandbox/test mode — check your
   provider's docs for how to avoid sending to real, unverified addresses
   while testing.
4. **Check delivery after the fact** — `GET /api/admin/email-logs` (or
   query `listEmailEvents()` directly) shows every attempt with its
   status, provider, and attempt count, whether or not the visual preview
   step ever ran.

Never point a real provider at production customer data from a local or
staging environment — the console provider (step 2) is the safe default
for exactly this reason.

## Abandoned-cart workflow

Configurable from **Store Settings → Abandoned cart emails**
(`/admin/settings`): an on/off switch and a delay in hours. Off by
default.

The rules (`selectAbandonedCartRecipients()` in `abandoned-cart.ts`, a
pure function you can unit test without a database):
- Only customers with `marketing_consent = true` — this is a marketing
  email, not a transactional one.
- Never sooner than the configured delay since the cart was last touched.
- Never sent if the customer has completed an order more recently than
  the cart was last touched — a converted cart isn't abandoned.
- Never sent twice for the same cart — `hasSentEmailFor()` checks the
  event log before every send, so re-running the job is always safe.
- Always includes a working one-click unsubscribe link
  (`unsubscribe.ts` + `/unsubscribe` + `POST /api/unsubscribe`) that
  flips the customer's marketing consent off — required for every
  "marketing" category email, enforced by `sendTransactionalEmail()`
  itself refusing to send a marketing email with no unsubscribe URL.

**Not yet live**: this targets the `carts`/`cart_items` tables in
`supabase/migrations/` — the app's actual running cart today is
client-side (Zustand + `localStorage`, see `src/store/cart-store.ts`),
which has no server-visible "last touched" timestamp for a scheduler to
scan. Activating this for real needs (1) the checkout/cart flow to start
persisting cart state to Supabase for signed-in customers, and (2)
something calling `POST /api/cron/abandoned-cart-emails` on a schedule
(`Authorization: Bearer <CRON_SECRET>` — see `.env.local.example`) —
Vercel Cron, a GitHub Actions workflow on a schedule, or any external
cron service. Until then, the workflow is fully built and testable at the
pure-function level, just not wired to live data.

## WhatsApp

A separate, deliberately dormant scaffold — see
[`src/lib/whatsapp/README.md`](../whatsapp/README.md). Nothing sends
until `WHATSAPP_ENABLED=true`, real credentials are set, **and** the
caller passes explicit per-customer consent for that specific channel.
