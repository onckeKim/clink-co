-- ============================================================================
-- 0008: Operations — newsletter_subscribers, contact_submissions, returns,
-- return_items. Both marketing tables follow the same shape: anyone may
-- INSERT (a public form, no auth required), nobody outside staff may ever
-- SELECT the list directly (it's a PII list), and self-service changes
-- (unsubscribe) go through a token, not a direct table UPDATE.
-- ============================================================================

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  status public.newsletter_status not null default 'subscribed',
  source text,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  subscribed_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger newsletter_subscribers_set_updated_at
  before update on public.newsletter_subscribers
  for each row execute function public.set_updated_at();

alter table public.newsletter_subscribers enable row level security;

create policy newsletter_subscribers_insert_open on public.newsletter_subscribers
  for insert to authenticated, anon
  with check (true);

create policy newsletter_subscribers_select_staff on public.newsletter_subscribers
  for select to authenticated
  using (public.has_permission('customers:view'));

-- The signup form may only ever set email/source; status, the token, and
-- the timestamps stay system-controlled (their column defaults).
revoke insert on public.newsletter_subscribers from authenticated, anon;
grant insert (email, source) on public.newsletter_subscribers to authenticated, anon;
-- No update/delete grant to anon/authenticated at all — see
-- unsubscribe_newsletter() below for the one self-service mutation path.

create or replace function public.unsubscribe_newsletter(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated boolean;
begin
  update public.newsletter_subscribers
  set status = 'unsubscribed', unsubscribed_at = now()
  where unsubscribe_token = p_token and status = 'subscribed';
  get diagnostics v_updated = row_count;
  return v_updated > 0;
end;
$$;

comment on function public.unsubscribe_newsletter(uuid) is
  'The one-click unsubscribe-link handler — an exact, unguessable token match only, same reasoning as get_wishlist_by_share_token().';

grant execute on function public.unsubscribe_newsletter(uuid) to authenticated, anon;

-- ----------------------------------------------------------------------------
create table public.contact_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email citext not null,
  subject text,
  message text not null check (char_length(message) between 1 and 4000),
  status public.contact_status not null default 'new',
  handled_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index contact_submissions_status_idx on public.contact_submissions (status);

create trigger contact_submissions_set_updated_at
  before update on public.contact_submissions
  for each row execute function public.set_updated_at();

alter table public.contact_submissions enable row level security;

create policy contact_submissions_insert_open on public.contact_submissions
  for insert to authenticated, anon
  with check (true);

create policy contact_submissions_select_staff on public.contact_submissions
  for select to authenticated
  using (public.has_permission('customers:view'));

create policy contact_submissions_update_staff on public.contact_submissions
  for update to authenticated
  using (public.has_permission('customers:view'))
  with check (public.has_permission('customers:view'));

revoke insert on public.contact_submissions from authenticated, anon;
grant insert (name, email, subject, message) on public.contact_submissions to authenticated, anon;

-- ----------------------------------------------------------------------------
-- returns / return_items — a customer requests a return against their own
-- order; staff with orders:fulfil work the approve/reject/receive/refund
-- lifecycle (src/lib/account/returns-store.ts's own doc comment names this
-- exact lifecycle as the intended real-world target). Support staff, who
-- hold orders:view but not orders:fulfil, can see every return but cannot
-- advance its status — the same "may view orders but may have restricted
-- refund permissions" rule already enforced on orders/payments.
-- ----------------------------------------------------------------------------
create table public.returns (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  reason public.return_reason not null,
  notes text,
  status public.return_status not null default 'requested',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index returns_status_idx on public.returns (status);
create index returns_user_id_idx on public.returns (user_id);

create trigger returns_set_updated_at
  before update on public.returns
  for each row execute function public.set_updated_at();

create or replace function public.guard_return_write()
returns trigger
language plpgsql
as $$
begin
  if public.is_trusted_context() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status <> 'requested' and not public.has_permission('orders:fulfil') then
      new.status := 'requested';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status and not public.has_permission('orders:fulfil') then
    raise exception 'Only fulfilment staff can change a return''s status.';
  end if;
  return new;
end;
$$;

create trigger returns_guard_write
  before insert or update on public.returns
  for each row execute function public.guard_return_write();

alter table public.returns enable row level security;

create policy returns_select_own on public.returns
  for select to authenticated
  using (user_id = auth.uid());

create policy returns_select_staff on public.returns
  for select to authenticated
  using (public.has_permission('orders:view'));

create policy returns_insert_own on public.returns
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

create policy returns_update on public.returns
  for update to authenticated
  using (user_id = auth.uid() or public.has_permission('orders:fulfil'))
  with check (user_id = auth.uid() or public.has_permission('orders:fulfil'));

create table public.return_items (
  id uuid primary key default gen_random_uuid(),
  return_id uuid not null references public.returns (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  quantity integer not null check (quantity > 0),
  created_at timestamptz not null default now(),
  unique (return_id, order_item_id)
);

create index return_items_return_id_idx on public.return_items (return_id);

alter table public.return_items enable row level security;

create policy return_items_select on public.return_items
  for select to authenticated
  using (
    exists (select 1 from public.returns r where r.id = return_id and r.user_id = auth.uid())
    or public.has_permission('orders:view')
  );

create policy return_items_insert_own on public.return_items
  for insert to authenticated
  with check (exists (select 1 from public.returns r where r.id = return_id and r.user_id = auth.uid()));

create policy return_items_delete on public.return_items
  for delete to authenticated
  using (
    exists (select 1 from public.returns r where r.id = return_id and r.user_id = auth.uid() and r.status = 'requested')
    or public.has_permission('orders:fulfil')
  );
