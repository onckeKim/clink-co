-- ============================================================================
-- 0011: Security hardening — closes gaps found by Supabase's security
-- advisor (`get_advisors`) after 0000-0010 were first applied to a real
-- project. Two real, distinct problems, not stylistic nits:
--
-- 1. `revoke execute ... from public` in 0005_promotions.sql did NOT
--    actually block anon/authenticated from calling redeem_discount_code()
--    directly via /rest/v1/rpc/redeem_discount_code. Supabase grants
--    EXECUTE on every new public-schema function to anon/authenticated via
--    its own default privileges, independently of the function's owner-set
--    grants — revoking from the PUBLIC pseudo-role doesn't touch that.
--    Those two roles need an explicit revoke. Left as-is, anyone could call
--    this function directly with an arbitrary order_id/amount, bypassing
--    the checkout flow's server-side pricing entirely.
-- 2. A handful of functions (SECURITY DEFINER and plain alike) didn't set
--    an explicit search_path, which is a search-path-hijack vector: a role
--    that can create objects earlier in the resolution path could shadow a
--    built-in/schema-qualified call inside the function body.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Lock down redeem_discount_code() to service_role only. It stays
-- SECURITY DEFINER (it needs to bypass RLS to write discount_redemptions
-- and update discount_codes.times_used), but no session-scoped role should
-- ever be able to invoke it directly — only the checkout Route Handler,
-- running as service_role, does.
-- ----------------------------------------------------------------------------
revoke execute on function public.redeem_discount_code(text, uuid, uuid, citext, numeric) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. The trigger-only functions below are declared `returns trigger`, which
-- Postgres already refuses to execute outside of an actual trigger context
-- — so this is defense-in-depth, not closing a real hole, but it also
-- removes the advisor's noise for functions that were never meant to be an
-- RPC surface at all.
-- ----------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_profile_email() from public, anon, authenticated;
revoke execute on function public.sync_profile_role() from public, anon, authenticated;
revoke execute on function public.sync_product_rating() from public, anon, authenticated;
revoke execute on function public.sync_product_stock() from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 3. Explicit search_path on every function the advisor flagged. Each is
-- re-declared with `create or replace function` using its exact original
-- body from 0001/0002/0006/0008 — only the `set search_path` line is new.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select public.current_app_role() <> 'customer';
$$;

create or replace function public.is_trusted_context()
returns boolean
language sql
stable
set search_path = public, pg_temp
as $$
  select coalesce((select rolbypassrls or rolsuper from pg_roles where rolname = current_user), false);
$$;

create or replace function public.guard_user_roles_self_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if coalesce(old.user_id, new.user_id) = auth.uid() then
    raise exception 'You cannot change your own admin role. Ask another super administrator to do it.';
  end if;
  return coalesce(new, old);
end;
$$;

create or replace function public.guard_profile_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
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

create or replace function public.immutable_english_tsvector(input text)
returns tsvector
language sql
immutable
parallel safe
set search_path = public, pg_temp
as $$
  select to_tsvector('english', coalesce(input, ''));
$$;

create or replace function public.guard_review_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if public.is_trusted_context() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    if new.status <> 'pending' and not public.has_permission('content:write') then
      new.status := 'pending';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status and not public.has_permission('content:write') then
    raise exception 'Only staff can change a review''s moderation status.';
  end if;
  if (new.rating is distinct from old.rating or new.title is distinct from old.title or new.body is distinct from old.body)
     and old.user_id is distinct from auth.uid()
     and not public.has_permission('content:write') then
    raise exception 'You can only edit your own review.';
  end if;
  return new;
end;
$$;

create or replace function public.guard_return_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
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
