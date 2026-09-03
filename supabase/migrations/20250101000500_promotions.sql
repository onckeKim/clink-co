-- ============================================================================
-- 0005: Promotions — discount_codes, discount_redemptions, and an atomic
-- redemption function that makes usage_limit an actual guarantee instead of
-- a best-effort check.
-- ============================================================================

create table public.discount_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code = upper(code) and char_length(code) between 2 and 40),
  description text,
  discount_type public.discount_type not null,
  discount_value numeric(10, 2) not null default 0 check (discount_value >= 0),
  free_delivery boolean not null default false,
  min_spend numeric(10, 2) check (min_spend is null or min_spend >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  product_ids uuid[] not null default '{}',
  collection_ids uuid[] not null default '{}',
  customer_emails citext[] not null default '{}',
  usage_limit integer check (usage_limit is null or usage_limit >= 0),
  times_used integer not null default 0 check (times_used >= 0),
  -- true: a customer must type `code` at checkout. false: an "automatic
  -- discount" — silently applied to any eligible cart, never shown as a
  -- redeemable code (src/types/coupon.ts).
  requires_code boolean not null default true,
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint percentage_capped_at_100
    check (discount_type <> 'percentage' or discount_value <= 100),
  constraint sale_window_order
    check (ends_at is null or starts_at is null or ends_at > starts_at),
  constraint usage_within_limit
    check (usage_limit is null or times_used <= usage_limit)
);

create index discount_codes_active_idx on public.discount_codes (active);

create trigger discount_codes_set_updated_at
  before update on public.discount_codes
  for each row execute function public.set_updated_at();

alter table public.discount_codes enable row level security;

-- Anyone may look up a code to validate it at checkout, or read the current
-- set of automatic discounts to price a cart — but only the ones currently
-- usable: active, inside its date window, and (if limited) not yet
-- exhausted. An expired/inactive/future code isn't discoverable by a public
-- SELECT at all.
create policy discount_codes_select_public on public.discount_codes
  for select to authenticated, anon
  using (
    active
    and (starts_at is null or now() >= starts_at)
    and (ends_at is null or now() <= ends_at)
    and (usage_limit is null or times_used < usage_limit)
  );

create policy discount_codes_select_staff on public.discount_codes
  for select to authenticated
  using (public.has_permission('promotions:view'));

create policy discount_codes_write_staff on public.discount_codes
  for insert to authenticated
  with check (public.has_permission('promotions:write'));

create policy discount_codes_update_staff on public.discount_codes
  for update to authenticated
  using (public.has_permission('promotions:write'))
  with check (public.has_permission('promotions:write'));

create policy discount_codes_delete_staff on public.discount_codes
  for delete to authenticated
  using (public.has_permission('promotions:write'));

-- times_used is maintained exclusively by redeem_discount_code() below —
-- block it from ordinary client writes even for staff (an admin editing a
-- coupon's rules should never be able to also quietly reset its usage
-- counter through the same form).
revoke update on public.discount_codes from authenticated;
grant update (
  code, description, discount_type, discount_value, free_delivery, min_spend,
  starts_at, ends_at, product_ids, collection_ids, customer_emails,
  usage_limit, requires_code, active
) on public.discount_codes to authenticated;

-- ----------------------------------------------------------------------------
-- discount_redemptions — one row per order a code was actually applied to.
-- Never written directly: only redeem_discount_code() (below) inserts,
-- inside the same transaction as order creation, so a code's usage_limit is
-- enforced atomically rather than "read times_used, then hope nothing else
-- redeemed it in between" (exactly the race src/types/coupon.ts's own doc
-- comment flags as unhandled by the in-memory version).
-- ----------------------------------------------------------------------------
create table public.discount_redemptions (
  id uuid primary key default gen_random_uuid(),
  discount_code_id uuid not null references public.discount_codes (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  customer_email citext not null,
  amount_discounted numeric(10, 2) not null check (amount_discounted >= 0),
  redeemed_at timestamptz not null default now(),
  unique (discount_code_id, order_id)
);

create index discount_redemptions_code_id_idx on public.discount_redemptions (discount_code_id);
create index discount_redemptions_user_id_idx on public.discount_redemptions (user_id);

alter table public.discount_redemptions enable row level security;

create policy discount_redemptions_select_own on public.discount_redemptions
  for select to authenticated
  using (user_id = auth.uid());

create policy discount_redemptions_select_staff on public.discount_redemptions
  for select to authenticated
  using (public.has_permission('promotions:view'));

-- No insert/update/delete policy for anon/authenticated: redemption only
-- happens inside redeem_discount_code().
revoke insert, update, delete on public.discount_redemptions from authenticated, anon;

create or replace function public.redeem_discount_code(
  p_code text,
  p_order_id uuid,
  p_user_id uuid,
  p_customer_email citext,
  p_amount_discounted numeric
)
returns public.discount_redemptions
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_discount record;
  v_redemption public.discount_redemptions;
begin
  -- FOR UPDATE locks this row for the rest of the transaction: a second,
  -- concurrent checkout redeeming the same near-exhausted code has to wait
  -- for this transaction to commit or roll back before it can even read
  -- times_used, which is what makes the usage_limit check below race-free.
  select * into v_discount
  from public.discount_codes
  where upper(code) = upper(p_code)
  for update;

  if not found then
    raise exception 'Unknown discount code: %', p_code;
  end if;
  if not v_discount.active then
    raise exception 'This discount code is no longer active.';
  end if;
  if v_discount.starts_at is not null and now() < v_discount.starts_at then
    raise exception 'This discount code is not active yet.';
  end if;
  if v_discount.ends_at is not null and now() > v_discount.ends_at then
    raise exception 'This discount code has expired.';
  end if;
  if v_discount.usage_limit is not null and v_discount.times_used >= v_discount.usage_limit then
    raise exception 'This discount code has reached its usage limit.';
  end if;
  if array_length(v_discount.customer_emails, 1) is not null
     and not (lower(p_customer_email) = any (select lower(unnest(v_discount.customer_emails)))) then
    raise exception 'This discount code is not valid for this customer.';
  end if;

  insert into public.discount_redemptions (discount_code_id, order_id, user_id, customer_email, amount_discounted)
  values (v_discount.id, p_order_id, p_user_id, p_customer_email, p_amount_discounted)
  returning * into v_redemption;

  update public.discount_codes
  set times_used = times_used + 1
  where id = v_discount.id;

  return v_redemption;
end;
$$;

comment on function public.redeem_discount_code(text, uuid, uuid, citext, numeric) is
  'Atomically validates and redeems a discount code against an order, row-locking the code so usage_limit can never be oversold by concurrent checkouts. Called from the checkout Route Handler (service role), inside the same transaction as order creation.';

-- Service-role only — see the file header on payments for the same
-- reasoning: this function moves money-adjacent state and must not be
-- callable directly from the browser with an arbitrary order_id.
revoke execute on function public.redeem_discount_code(text, uuid, uuid, citext, numeric) from public;
