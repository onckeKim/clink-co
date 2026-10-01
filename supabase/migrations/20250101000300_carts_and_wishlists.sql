-- ============================================================================
-- 0003: Carts & wishlists.
--
-- Security note that applies to every table in this file: RLS policies here
-- only grant access to the `authenticated` Postgres role, on rows they own
-- (user_id = auth.uid()). There is deliberately NO anon policy anywhere in
-- this file. A guest (not signed in) cart/wishlist has no Postgres session
-- to own — auth.uid() is null for an anon request — so RLS cannot express
-- "this anonymous browser owns this row" at all (an anon client could pass
-- any session_id it likes; nothing about the request proves ownership of
-- one). Guest cart/wishlist reads and writes are handled by the Next.js
-- Route Handlers using the service-role key (which bypasses RLS entirely,
-- same as today's checkout API route), validating the guest's session_id
-- against an httpOnly cookie the browser can't forge. See
-- supabase/README.md and src/lib/db/cart.ts.
-- ============================================================================

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete cascade,
  session_id text,
  status public.cart_status not null default 'active',
  coupon_code text,
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_has_an_owner check (user_id is not null or session_id is not null)
);

-- One active cart per signed-in user, and one per guest session.
create unique index carts_one_active_per_user on public.carts (user_id) where status = 'active' and user_id is not null;
create unique index carts_one_active_per_session on public.carts (session_id) where status = 'active' and session_id is not null;

create trigger carts_set_updated_at
  before update on public.carts
  for each row execute function public.set_updated_at();

alter table public.carts enable row level security;

create policy carts_all_own on public.carts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete set null,
  quantity integer not null check (quantity > 0 and quantity <= 99),
  -- Price snapshotted at add-to-cart time so the displayed line total
  -- doesn't silently change if the product's price changes while it sits
  -- in someone's cart; checkout always re-validates against the live
  -- product price before charging (see src/app/api/cart/validate/route.ts's
  -- existing behavior, which this mirrors).
  unit_price_snapshot numeric(10, 2) not null check (unit_price_snapshot >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index cart_items_unique_line
  on public.cart_items (cart_id, product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index cart_items_cart_id_idx on public.cart_items (cart_id);

create trigger cart_items_set_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

alter table public.cart_items enable row level security;

create policy cart_items_all_own on public.cart_items
  for all to authenticated
  using (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists (select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

-- ----------------------------------------------------------------------------
-- wishlists — one per customer (src/store/wishlist-store.ts's simple
-- toggle/has model). share_token backs the app's existing
-- /wishlist/shared link feature: it's an unguessable 128-bit random value,
-- and the ONLY way to read a wishlist by token is the SECURITY DEFINER
-- function below, never a direct table SELECT — see the comment on that
-- function for why a direct "select where share_token is not null" RLS
-- policy would leak every shared wishlist's contents to anyone, not just
-- someone holding one specific link.
-- ----------------------------------------------------------------------------
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  share_token uuid unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger wishlists_set_updated_at
  before update on public.wishlists
  for each row execute function public.set_updated_at();

alter table public.wishlists enable row level security;

create policy wishlists_all_own on public.wishlists
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wishlist_id, product_id)
);

create index wishlist_items_wishlist_id_idx on public.wishlist_items (wishlist_id);

alter table public.wishlist_items enable row level security;

create policy wishlist_items_all_own on public.wishlist_items
  for all to authenticated
  using (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()))
  with check (exists (select 1 from public.wishlists w where w.id = wishlist_id and w.user_id = auth.uid()));

-- No RLS policy grants anon or authenticated direct SELECT on wishlists by
-- share_token: this function is the only path. It runs as its owner
-- (SECURITY DEFINER, bypassing RLS internally) and returns exactly the one
-- wishlist matching an exact, already-known token — there is no way to use
-- it to enumerate or browse other people's wishlists, because a random
-- UUID can't be guessed or iterated, and the function accepts no other
-- filter.
create or replace function public.get_wishlist_by_share_token(p_token uuid)
returns table (
  wishlist_id uuid,
  product_id uuid
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select wi.wishlist_id, wi.product_id
  from public.wishlists w
  join public.wishlist_items wi on wi.wishlist_id = w.id
  where w.share_token = p_token;
$$;

grant execute on function public.get_wishlist_by_share_token(uuid) to authenticated, anon;

comment on function public.get_wishlist_by_share_token(uuid) is
  'The only path to read a wishlist''s contents by its share token — see /wishlist/shared. Not a substitute for listing/browsing: an exact token match only.';
