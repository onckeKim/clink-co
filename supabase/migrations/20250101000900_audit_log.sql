-- ============================================================================
-- 0009: admin_audit_logs — "admin actions must be logged", made structurally
-- true rather than merely conventional: there is no INSERT policy for
-- anon/authenticated at all, so the only way a row is ever created is
-- log_admin_action() below, which fills in *who* acted from auth.uid()
-- itself (never a client-supplied value, so it can't be forged), and there
-- is no UPDATE or DELETE policy at all, ever — an audit trail that could be
-- edited or removed after the fact wouldn't be one.
-- ============================================================================

create table public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles (id) on delete set null,
  -- Snapshotted, not just joined from profiles, so the log still reads
  -- correctly even if the acting account is later deleted.
  user_email citext not null,
  action text not null check (char_length(action) between 1 and 200),
  entity_type text not null check (entity_type in (
    'product', 'category', 'collection', 'coupon', 'order',
    'customer', 'content', 'media', 'settings', 'team_member'
  )),
  entity_id text not null,
  entity_label text not null,
  before jsonb,
  after jsonb,
  created_at timestamptz not null default now()
);

create index admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index admin_audit_logs_entity_type_idx on public.admin_audit_logs (entity_type);
create index admin_audit_logs_user_id_idx on public.admin_audit_logs (user_id);
create index admin_audit_logs_search_idx on public.admin_audit_logs
  using gin ((action || ' ' || entity_label || ' ' || entity_id) gin_trgm_ops);

alter table public.admin_audit_logs enable row level security;

create policy admin_audit_logs_select_staff on public.admin_audit_logs
  for select to authenticated
  using (public.has_permission('audit:view'));

-- No insert/update/delete policy for anon/authenticated at all — see the
-- function below and the file header.
revoke insert, update, delete on public.admin_audit_logs from authenticated, anon;

create or replace function public.log_admin_action(
  p_action text,
  p_entity_type text,
  p_entity_id text,
  p_entity_label text,
  p_before jsonb default null,
  p_after jsonb default null
)
returns public.admin_audit_logs
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email citext;
  v_entry public.admin_audit_logs;
begin
  if not public.is_admin() then
    raise exception 'Only admin accounts can write to the audit log.';
  end if;

  select email into v_email from public.profiles where id = auth.uid();

  insert into public.admin_audit_logs (user_id, user_email, action, entity_type, entity_id, entity_label, before, after)
  values (auth.uid(), coalesce(v_email, 'unknown'), p_action, p_entity_type, p_entity_id, p_entity_label, p_before, p_after)
  returning * into v_entry;

  return v_entry;
end;
$$;

comment on function public.log_admin_action(text, text, text, text, jsonb, jsonb) is
  'The only way an admin_audit_logs row is ever created. user_id/user_email come from auth.uid(), never a caller-supplied value, so an entry cannot be forged or attributed to someone else. Call this from every admin mutation — see src/lib/db/audit.ts.';

-- Every admin role may log its own actions (a product_manager updating a
-- product must be able to log it, even though product_manager itself lacks
-- audit:view) — the function's own is_admin() check is the real gate, not
-- this grant.
grant execute on function public.log_admin_action(text, text, text, text, jsonb, jsonb) to authenticated;
