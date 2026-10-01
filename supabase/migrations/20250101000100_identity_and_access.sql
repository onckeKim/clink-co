-- ============================================================================
-- 0001: Identity & access — profiles, role_permissions, user_roles,
-- addresses, and the RLS helper functions every later migration calls.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- profiles — one row per Supabase Auth user (id is a foreign key to
-- auth.users, not a separate identity). Created automatically by the
-- handle_new_user() trigger below the moment someone signs up; the app
-- never inserts a profile directly.
-- ----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  -- Denormalized cache of auth.users.email (kept in sync by sync_profile_email()
  -- below) so admin surfaces can search/display it without a service-role
  -- Admin API call — see src/lib/account/profiles-store.ts's own doc comment,
  -- which this table implements 1:1.
  email citext,
  first_name text,
  last_name text,
  phone text,
  date_of_birth date,
  marketing_consent boolean not null default false,
  -- Denormalized cache of this user's admin role. user_roles (below) is the
  -- source of truth for *granting* a role; this column exists so every RLS
  -- policy in the schema can check `current_app_role()` with a single
  -- indexed lookup instead of a join, and so the app's existing
  -- `profile.role` reads (src/lib/admin/roles.ts) need no code change. Kept
  -- in sync by sync_profile_role() and never writable directly by a client
  -- — see the guard_profile_update trigger below.
  role public.app_role not null default 'customer',
  is_disabled boolean not null default false,
  disabled_reason text,
  avatar_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint disabled_reason_requires_disabled
    check (disabled_reason is null or is_disabled),
  constraint phone_format
    check (phone is null or phone ~ '^\+?[0-9 ()-]{7,20}$')
);

comment on table public.profiles is
  'One row per Supabase Auth user. role is a denormalized cache of user_roles — see sync_profile_role().';

create index profiles_role_idx on public.profiles (role) where deleted_at is null;
create index profiles_email_trgm_idx on public.profiles using gin (email gin_trgm_ops);
create index profiles_name_trgm_idx on public.profiles using gin ((coalesce(first_name, '') || ' ' || coalesce(last_name, '')) gin_trgm_ops);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- role_permissions — the ROLE_PERMISSIONS matrix from src/lib/admin/roles.ts,
-- as data. This is the single source of truth `has_permission()` (below)
-- reads from; keeping the matrix in a table (rather than hard-coded CASE
-- logic in a function) means it's inspectable with a plain SELECT and can be
-- audited alongside the TypeScript copy for drift.
-- ----------------------------------------------------------------------------
create table public.role_permissions (
  role public.app_role not null,
  permission text not null check (permission in (
    'dashboard:view',
    'products:view', 'products:write',
    'categories:view', 'categories:write',
    'collections:view', 'collections:write',
    'orders:view', 'orders:fulfil', 'orders:export',
    'customers:view', 'customers:write',
    'promotions:view', 'promotions:write',
    'content:view', 'content:write',
    'media:view', 'media:write',
    'settings:view', 'settings:write',
    'team:view', 'team:write',
    'audit:view'
  )),
  primary key (role, permission)
);

comment on table public.role_permissions is
  'Data mirror of ROLE_PERMISSIONS in src/lib/admin/roles.ts — keep both in sync by hand; see supabase/README.md.';

insert into public.role_permissions (role, permission) values
  -- super_admin: every permission.
  ('super_admin', 'dashboard:view'), ('super_admin', 'products:view'), ('super_admin', 'products:write'),
  ('super_admin', 'categories:view'), ('super_admin', 'categories:write'),
  ('super_admin', 'collections:view'), ('super_admin', 'collections:write'),
  ('super_admin', 'orders:view'), ('super_admin', 'orders:fulfil'), ('super_admin', 'orders:export'),
  ('super_admin', 'customers:view'), ('super_admin', 'customers:write'),
  ('super_admin', 'promotions:view'), ('super_admin', 'promotions:write'),
  ('super_admin', 'content:view'), ('super_admin', 'content:write'),
  ('super_admin', 'media:view'), ('super_admin', 'media:write'),
  ('super_admin', 'settings:view'), ('super_admin', 'settings:write'),
  ('super_admin', 'team:view'), ('super_admin', 'team:write'),
  ('super_admin', 'audit:view'),
  -- store_admin: every permission except team:write (cannot grant/revoke
  -- admin roles) — src/lib/admin/roles.ts: "ALL_PERMISSIONS.filter(p => p !== 'team:write')".
  ('store_admin', 'dashboard:view'), ('store_admin', 'products:view'), ('store_admin', 'products:write'),
  ('store_admin', 'categories:view'), ('store_admin', 'categories:write'),
  ('store_admin', 'collections:view'), ('store_admin', 'collections:write'),
  ('store_admin', 'orders:view'), ('store_admin', 'orders:fulfil'), ('store_admin', 'orders:export'),
  ('store_admin', 'customers:view'), ('store_admin', 'customers:write'),
  ('store_admin', 'promotions:view'), ('store_admin', 'promotions:write'),
  ('store_admin', 'content:view'), ('store_admin', 'content:write'),
  ('store_admin', 'media:view'), ('store_admin', 'media:write'),
  ('store_admin', 'settings:view'), ('store_admin', 'settings:write'),
  ('store_admin', 'team:view'),
  ('store_admin', 'audit:view'),
  -- product_manager
  ('product_manager', 'dashboard:view'), ('product_manager', 'products:view'), ('product_manager', 'products:write'),
  ('product_manager', 'categories:view'), ('product_manager', 'categories:write'),
  ('product_manager', 'collections:view'), ('product_manager', 'collections:write'),
  ('product_manager', 'media:view'), ('product_manager', 'media:write'),
  -- order_fulfilment
  ('order_fulfilment', 'dashboard:view'), ('order_fulfilment', 'orders:view'),
  ('order_fulfilment', 'orders:fulfil'), ('order_fulfilment', 'orders:export'),
  ('order_fulfilment', 'customers:view'), ('order_fulfilment', 'products:view'),
  -- content_editor
  ('content_editor', 'dashboard:view'), ('content_editor', 'content:view'), ('content_editor', 'content:write'),
  ('content_editor', 'media:view'), ('content_editor', 'media:write'), ('content_editor', 'categories:view'),
  -- customer_support — deliberately no orders:fulfil, so no refund/cancel/
  -- tracking/status-change ability: "Support users may view orders but may
  -- have restricted refund permissions" is enforced by this omission, both
  -- in the app (src/app/api/admin/orders/[orderNumber]/refund/route.ts
  -- checks orders:fulfil) and here.
  ('customer_support', 'dashboard:view'), ('customer_support', 'customers:view'),
  ('customer_support', 'customers:write'), ('customer_support', 'orders:view');

-- ----------------------------------------------------------------------------
-- RLS helper functions. All three are STABLE + SECURITY DEFINER with an
-- explicit search_path (blocking a search_path-hijack attack against a
-- SECURITY DEFINER function — always set this on every such function) and
-- are owned by the migration role, which also owns `profiles`/`role_permissions`
-- — Postgres RLS never applies to a table's owner, so these functions read
-- profiles/role_permissions directly without themselves triggering RLS and
-- recursing back into the very policies that call them.
-- ----------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.app_role
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role from public.profiles where id = auth.uid() and deleted_at is null),
    'customer'::public.app_role
  );
$$;

comment on function public.current_app_role() is
  'The calling user''s current role (''customer'' for signed-out/no-profile). Use in RLS policies instead of joining profiles directly.';

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_app_role() <> 'customer';
$$;

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.role_permissions rp
    where rp.role = public.current_app_role()
      and rp.permission = p_permission
  );
$$;

comment on function public.has_permission(text) is
  'True if the calling user''s role holds this permission per role_permissions. Mirrors hasPermission() in src/lib/admin/roles.ts exactly.';

-- RLS itself never applies to a role with BYPASSRLS — Supabase's
-- service_role has it, and so does the `postgres` role migrations and
-- `seed.sql` run as — but a plain BEFORE INSERT/UPDATE trigger fires for
-- every role regardless, with no equivalent automatic bypass. Every
-- guard_* trigger in this schema (profiles, reviews, returns) checks this
-- first, so trusted server-side code (a checkout Route Handler, an import
-- script, this repo's own migrations/seed) can write rows those triggers
-- would otherwise reject from an ordinary `authenticated` session —
-- auth.uid() is null outside of a real user session, so has_permission()
-- alone can't tell "the server, acting deliberately" apart from "no
-- session at all".
create or replace function public.is_trusted_context()
returns boolean
language sql
stable
as $$
  select coalesce((select rolbypassrls or rolsuper from pg_roles where rolname = current_user), false);
$$;

comment on function public.is_trusted_context() is
  'True for any Postgres role with BYPASSRLS or superuser (service_role in a real Supabase project; postgres locally) — the roles every guard_* trigger lets through unconditionally, matching what RLS itself already exempts.';

-- ----------------------------------------------------------------------------
-- user_roles — the authoritative record of *who granted which admin role,
-- and when*. One active admin role per user (unique(user_id) below), same
-- one-role-per-profile model the app already uses; "customer" is simply the
-- absence of a row here, matching src/lib/account/profiles-store.ts's
-- "every account is a customer by default; the six admin roles are
-- additive". profiles.role is a cache of this table, kept in sync by the
-- trigger that follows.
-- ----------------------------------------------------------------------------
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null check (role <> 'customer'),
  granted_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id)
);

comment on table public.user_roles is
  'Admin role grants — insert/update/delete requires team:write (super_admin only, per role_permissions). profiles.role mirrors this table; see sync_profile_role().';

create index user_roles_role_idx on public.user_roles (role);

create or replace function public.sync_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  update public.profiles
  set role = coalesce(
    (select role from public.user_roles where user_id = v_user_id),
    'customer'::public.app_role
  )
  where id = v_user_id;
  return coalesce(new, old);
end;
$$;

create trigger user_roles_sync_profile_role
  after insert or update or delete on public.user_roles
  for each row execute function public.sync_profile_role();

-- Guard against a super_admin editing their own row here to self-demote —
-- the app already blocks this in the API layer
-- (src/app/api/admin/team/[id]/route.ts); this is the same rule enforced at
-- the database boundary so it holds even against a direct table write.
create or replace function public.guard_user_roles_self_change()
returns trigger
language plpgsql
as $$
begin
  if coalesce(old.user_id, new.user_id) = auth.uid() then
    raise exception 'You cannot change your own admin role. Ask another super administrator to do it.';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger user_roles_guard_self_change
  before update or delete on public.user_roles
  for each row execute function public.guard_user_roles_self_change();

-- Blocks a direct client UPDATE from changing profiles.role / is_disabled /
-- disabled_reason without the matching permission — role changes belong in
-- user_roles (team:write only, synced back via the trigger above);
-- is_disabled/disabled_reason require customers:write. Because Supabase
-- puts every signed-in user (customer or admin) on the same Postgres
-- `authenticated` role, a column-level GRANT can't tell them apart — only a
-- row-aware trigger like this can. A profile owner updating their own name/
-- phone/etc. is unaffected; the guard only fires when those three specific
-- columns actually change.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_trusted_context() then
    return new;
  end if;
  if new.role is distinct from old.role and not public.has_permission('team:write') then
    raise exception 'Only a super administrator can change an account''s role.';
  end if;
  if (new.is_disabled is distinct from old.is_disabled or new.disabled_reason is distinct from old.disabled_reason)
     and not public.has_permission('customers:write') then
    raise exception 'You do not have permission to enable or disable this account.';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_update
  before update on public.profiles
  for each row execute function public.guard_profile_update();

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.role_permissions enable row level security;

-- profiles: a customer reads/updates only their own row; staff who manage
-- customers or the admin team can read every row (never every column is
-- exposed beyond what's already here — there's no password/secret on this
-- table; Supabase Auth owns credentials separately and this schema never
-- touches auth.users' password hash).
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = auth.uid());

create policy profiles_select_staff on public.profiles
  for select to authenticated
  using (public.has_permission('customers:view') or public.has_permission('team:view'));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy profiles_update_staff on public.profiles
  for update to authenticated
  using (public.has_permission('customers:write') or public.has_permission('team:write'))
  with check (public.has_permission('customers:write') or public.has_permission('team:write'));

-- No insert/delete policy for profiles at all: rows are created only by
-- handle_new_user() (below, SECURITY DEFINER) and deleted only via
-- auth.users cascading (an account deletion), never by a client directly.

-- user_roles: only team:write (super_admin) may read or write role grants;
-- store_admin and everyone else can see the *labels* via profiles.role but
-- not the grant history/who-granted-it detail here.
create policy user_roles_all_team_write on public.user_roles
  for all to authenticated
  using (public.has_permission('team:write'))
  with check (public.has_permission('team:write'));

-- role_permissions is reference data everyone can read (it has no secrets —
-- it's the same matrix already public in the client bundle via
-- src/lib/admin/roles.ts) and only ever changes via a migration.
create policy role_permissions_select_all on public.role_permissions
  for select to authenticated, anon
  using (true);

-- ----------------------------------------------------------------------------
-- addresses — a customer's saved delivery/billing addresses. Fully private:
-- owner-only read/write, plus a read-only staff allowance so support can
-- look up (never edit) a customer's address while helping with an order.
-- ----------------------------------------------------------------------------
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  label text,
  full_name text not null,
  line1 text not null,
  line2 text,
  suburb text not null,
  city text not null,
  province text not null check (province in (
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State',
    'Mpumalanga', 'North West', 'Limpopo', 'Northern Cape'
  )),
  postal_code text not null check (postal_code ~ '^[0-9]{4}$'),
  phone text not null check (phone ~ '^\+?[0-9 ()-]{7,20}$'),
  is_default_delivery boolean not null default false,
  is_default_billing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index addresses_user_id_idx on public.addresses (user_id);
-- At most one default-delivery and one default-billing address per customer.
create unique index addresses_one_default_delivery on public.addresses (user_id) where is_default_delivery;
create unique index addresses_one_default_billing on public.addresses (user_id) where is_default_billing;

create trigger addresses_set_updated_at
  before update on public.addresses
  for each row execute function public.set_updated_at();

alter table public.addresses enable row level security;

create policy addresses_all_own on public.addresses
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy addresses_select_staff on public.addresses
  for select to authenticated
  using (public.has_permission('customers:view'));

-- ----------------------------------------------------------------------------
-- handle_new_user() — populates profiles the moment someone signs up (email/
-- OAuth alike). Bootstrap-admin granting (ADMIN_BOOTSTRAP_EMAILS) stays an
-- application-layer step, not a DB trigger concern: that env var lives in
-- the Next.js runtime, not in Postgres, and keeping it there avoids storing
-- deploy configuration inside the database. See supabase/README.md and
-- src/lib/account/profiles-store.ts's existing ensureProfile() doc comment.
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.email is distinct from old.email then
    update public.profiles set email = new.email where id = new.id;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_email_updated
  after update of email on auth.users
  for each row execute function public.sync_profile_email();
