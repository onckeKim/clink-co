-- ============================================================================
-- 0012: handle_new_user() picks up marketing_consent from raw_user_meta_data,
-- the same way it already does for first_name/last_name — closes a gap
-- found while wiring the signup Route Handler to this schema: the signup
-- form's marketing-consent checkbox had nowhere to land, since the trigger
-- only ever read first_name/last_name off signUp()'s `options.data`.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.profiles (id, email, first_name, last_name, marketing_consent)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    coalesce((new.raw_user_meta_data ->> 'marketing_consent')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
