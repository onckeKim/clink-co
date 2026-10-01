-- ============================================================================
-- 0004: Orders, order line items, payments, and shipments.
--
-- This file carries the two hardest security requirements in the whole
-- schema: "customers may not change ... order totals" and "payment records
-- should only be written through secure server-side logic". Both are
-- enforced two ways at once — a normal RLS row policy, AND a column/command
-- -level GRANT restriction that holds even if a policy were ever
-- misconfigured. See the comments inline and the final security-decisions
-- summary.
-- ============================================================================

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  -- The client-generated key that makes order creation idempotent — a
  -- retried checkout request (double-click, network replay) returns the
  -- existing order instead of creating a duplicate. UNIQUE here is the
  -- atomic guarantee src/lib/orders/store.ts's own doc comment calls out as
  -- missing from the in-memory version ("a concurrent duplicate INSERT
  -- fails atomically instead of relying on an in-process Map check-then-set").
  idempotency_key text not null unique,
  status public.order_status not null default 'pending_payment',

  user_id uuid references public.profiles (id) on delete set null,
  is_guest boolean not null default true,
  customer_email citext not null,
  customer_name text not null check (char_length(customer_name) between 1 and 200),

  currency text not null default 'ZAR' check (currency = 'ZAR'),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(10, 2) not null default 0 check (delivery_fee >= 0),
  tax_amount numeric(10, 2) not null default 0 check (tax_amount >= 0),
  total numeric(10, 2) not null check (total >= 0),
  coupon_code text,

  -- Snapshotted at order time, not a foreign key: an address can be edited
  -- or deleted from someone's address book long after the order that used
  -- it was placed, and the order must keep showing exactly what was
  -- shipped-to/billed-to at the time.
  delivery_address jsonb not null,
  billing_address jsonb not null,
  delivery_method_id public.delivery_method not null,
  delivery_label text not null,
  estimated_delivery_earliest date,
  estimated_delivery_latest date,

  shipping_notes text,
  gift_message text,
  marketing_consent boolean not null default false,

  payment_method public.payment_method not null,
  payment_reference text,
  payment_redirect_url text,

  tracking_carrier text,
  tracking_number text,
  tracking_url text,

  cancelled_reason text,
  refund_amount numeric(10, 2) check (refund_amount is null or refund_amount >= 0),
  refund_reason text,
  refunded_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The integrity guarantee behind "customers may not change ... order
  -- totals": total is not just conventionally derived from its components,
  -- it is IMPOSSIBLE to store a row where it isn't. Even a write that
  -- somehow bypassed every RLS/grant layer below would still be rejected
  -- here.
  constraint total_matches_components
    check (total = subtotal - discount_amount + delivery_fee + tax_amount),
  constraint refund_not_more_than_total
    check (refund_amount is null or refund_amount <= total)
);

create index orders_order_number_idx on public.orders (order_number);
create index orders_user_id_idx on public.orders (user_id);
create index orders_customer_email_idx on public.orders (customer_email);
create index orders_status_idx on public.orders (status);
create index orders_created_at_idx on public.orders (created_at desc);
create index orders_payment_reference_idx on public.orders (payment_reference) where payment_reference is not null;

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

alter table public.orders enable row level security;

-- Customers see only their own orders.
create policy orders_select_own on public.orders
  for select to authenticated
  using (user_id = auth.uid());

-- Staff with orders:view see everything (order list/search — /admin/orders).
create policy orders_select_staff on public.orders
  for select to authenticated
  using (public.has_permission('orders:view'));

-- Staff with orders:fulfil may update — but see the GRANT below: the
-- column set they can actually touch excludes every financial field.
create policy orders_update_staff on public.orders
  for update to authenticated
  using (public.has_permission('orders:fulfil'))
  with check (public.has_permission('orders:fulfil'));

-- No INSERT policy at all for anon/authenticated: an order is created by
-- POST /api/checkout using the service-role key after the server has
-- independently re-priced the cart against live product prices/stock/
-- coupon rules — never a direct client insert with client-supplied totals.
-- No DELETE policy ever: an order is cancelled (status = 'cancelled'), never removed.

-- Belt-and-suspenders column lock: even though the policies above already
-- restrict which ROWS staff can update, this restricts which COLUMNS any
-- authenticated session (customer or staff — Supabase gives both the same
-- Postgres role) can touch at all, so a bug in a future policy can't
-- accidentally expose the financial columns for writing.
revoke update on public.orders from authenticated;
grant update (
  status, payment_reference, payment_redirect_url,
  tracking_carrier, tracking_number, tracking_url,
  cancelled_reason, refund_amount, refund_reason, refunded_at
) on public.orders to authenticated;
revoke insert, delete on public.orders from authenticated, anon;

-- ----------------------------------------------------------------------------
-- order_items — fully immutable after the order is created. A refund or
-- cancellation is recorded on the order/return, never by editing a line
-- item's price or quantity after the fact.
-- ----------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  variant_id uuid references public.product_variants (id) on delete set null,
  sku text not null,
  name text not null,
  image text,
  variant_label text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint line_total_matches_unit_price check (line_total = unit_price * quantity)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_product_id_idx on public.order_items (product_id);

alter table public.order_items enable row level security;

create policy order_items_select_own on public.order_items
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy order_items_select_staff on public.order_items
  for select to authenticated
  using (public.has_permission('orders:view'));

-- No insert/update/delete policy for anon/authenticated at all — line items
-- are written only by the service-role checkout flow, once, at order
-- creation.
revoke insert, update, delete on public.order_items from authenticated, anon;

-- ----------------------------------------------------------------------------
-- payments — a ledger of payment *attempts* against an order (supports a
-- retry after a decline without losing the failed attempt's record).
-- "Payment records should only be written through secure server-side
-- logic": there is no insert/update/delete policy for anon/authenticated
-- anywhere in this table, at all — only the service role (used exclusively
-- by src/app/api/checkout, .../payments/*, and .../webhooks/payments/*)
-- can write here, whether creating a pending payment, applying a webhook's
-- status update, or recording a refund.
-- ----------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  provider public.payment_method not null,
  provider_reference text,
  status public.payment_status not null default 'pending',
  amount numeric(10, 2) not null check (amount >= 0),
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  -- The raw webhook/provider payload, kept for audit/dispute resolution.
  -- Never exposed to the `authenticated` role (see the column REVOKE
  -- below) — provider payloads can carry more account/instrument metadata
  -- than a customer or even most staff should see; a real investigation
  -- happens via the Supabase dashboard (service_role), not the app.
  raw_response jsonb,
  -- `${provider}:${providerEventId}` — enforces webhook idempotency at the
  -- database level (src/lib/orders/store.ts's own doc comment names this
  -- exact mechanism as the production-grade replacement for its in-memory
  -- processedWebhookEvents Set).
  processed_webhook_event_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_order_id_idx on public.payments (order_id);
create index payments_provider_reference_idx on public.payments (provider_reference) where provider_reference is not null;

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

create policy payments_select_own on public.payments
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy payments_select_staff on public.payments
  for select to authenticated
  using (public.has_permission('orders:view'));

-- Column lock: authenticated (customer or staff alike) may see that a
-- payment happened and its outcome, never the raw provider payload or the
-- internal webhook-dedupe key.
revoke select on public.payments from authenticated;
grant select (id, order_id, provider, provider_reference, status, amount, currency, created_at, updated_at)
  on public.payments to authenticated;
revoke insert, update, delete on public.payments from authenticated, anon;

-- ----------------------------------------------------------------------------
-- shipments — formalizes the ad-hoc tracking_* fields on orders into a
-- proper record, and supports more than one shipment per order (a partial/
-- split fulfilment) without the schema changing later.
-- ----------------------------------------------------------------------------
create table public.shipments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  carrier text not null,
  tracking_number text not null,
  tracking_url text,
  status public.shipment_status not null default 'pending',
  shipped_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index shipments_order_id_idx on public.shipments (order_id);

create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

alter table public.shipments enable row level security;

create policy shipments_select_own on public.shipments
  for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

create policy shipments_all_staff on public.shipments
  for all to authenticated
  using (public.has_permission('orders:fulfil'))
  with check (public.has_permission('orders:fulfil'));
