-- ============================================================================
-- 0006: User-generated content — reviews, review_images, product_questions,
-- product_answers — plus the trigger that keeps products.rating/
-- review_count current.
-- ============================================================================

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  -- Links a review to the specific order line it was purchased in, backing
  -- the `verified` badge with an actual purchase record instead of a
  -- client-asserted boolean.
  order_item_id uuid references public.order_items (id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 1 and 120),
  location text,
  rating smallint not null check (rating between 1 and 5),
  title text,
  body text not null check (char_length(body) between 1 and 4000),
  verified boolean not null default false,
  -- New reviews start 'pending' (a moderation queue) regardless of who
  -- posts them or what they claim — see guard_review_write() below, which
  -- forces this even against a client that tries to set 'published'
  -- directly on insert.
  status public.moderation_status not null default 'pending',
  helpful_count integer not null default 0 check (helpful_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index reviews_product_id_idx on public.reviews (product_id) where status = 'published';
create index reviews_status_idx on public.reviews (status);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

-- Row-aware guard: RLS's USING/WITH CHECK can restrict *which rows* a
-- policy applies to, but "a customer may edit their own review's text, a
-- moderator may only ever change its status" needs to also restrict which
-- *columns* change depending on *who's* doing it — and customers and staff
-- share the same Postgres `authenticated` role in Supabase, so a column
-- GRANT can't tell them apart. A trigger, which sees both the acting user
-- (auth.uid()) and the specific row, can.
create or replace function public.guard_review_write()
returns trigger
language plpgsql
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

  -- tg_op = 'UPDATE'
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

create trigger reviews_guard_write
  before insert or update on public.reviews
  for each row execute function public.guard_review_write();

alter table public.reviews enable row level security;

create policy reviews_select_published on public.reviews
  for select to authenticated, anon
  using (status = 'published');

create policy reviews_select_own on public.reviews
  for select to authenticated
  using (user_id = auth.uid());

create policy reviews_select_staff on public.reviews
  for select to authenticated
  using (public.has_permission('content:view'));

create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (user_id = auth.uid());

create policy reviews_update on public.reviews
  for update to authenticated
  using (user_id = auth.uid() or public.has_permission('content:write'))
  with check (user_id = auth.uid() or public.has_permission('content:write'));

create policy reviews_delete on public.reviews
  for delete to authenticated
  using (user_id = auth.uid() or public.has_permission('content:write'));

-- ----------------------------------------------------------------------------
-- review_images — customer-submitted photos on a review.
-- ----------------------------------------------------------------------------
create table public.review_images (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index review_images_review_id_idx on public.review_images (review_id);

alter table public.review_images enable row level security;

create policy review_images_select on public.review_images
  for select to authenticated, anon
  using (
    exists (select 1 from public.reviews r where r.id = review_id and (r.status = 'published' or r.user_id = auth.uid()))
    or public.has_permission('content:view')
  );

create policy review_images_write_own on public.review_images
  for insert to authenticated
  with check (exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid()));

create policy review_images_delete on public.review_images
  for delete to authenticated
  using (
    exists (select 1 from public.reviews r where r.id = review_id and r.user_id = auth.uid())
    or public.has_permission('content:write')
  );

-- ----------------------------------------------------------------------------
-- product_questions / product_answers
-- ----------------------------------------------------------------------------
create table public.product_questions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  user_id uuid references public.profiles (id) on delete set null,
  asked_by_name text not null check (char_length(asked_by_name) between 1 and 120),
  question text not null check (char_length(question) between 1 and 1000),
  -- Unlike reviews, questions default straight to 'published' — matching
  -- the app's current, un-moderated Q&A behavior (src/data/qa.ts has no
  -- moderation concept). Staff can still reject one later.
  status public.moderation_status not null default 'published',
  created_at timestamptz not null default now()
);

create index product_questions_product_id_idx on public.product_questions (product_id) where status = 'published';

alter table public.product_questions enable row level security;

create policy product_questions_select_published on public.product_questions
  for select to authenticated, anon
  using (status = 'published');

create policy product_questions_select_own on public.product_questions
  for select to authenticated
  using (user_id = auth.uid());

create policy product_questions_select_staff on public.product_questions
  for select to authenticated
  using (public.has_permission('content:view'));

create policy product_questions_insert_own on public.product_questions
  for insert to authenticated
  with check (user_id = auth.uid());

create policy product_questions_moderate_staff on public.product_questions
  for update to authenticated
  using (public.has_permission('content:write'))
  with check (public.has_permission('content:write'));

create policy product_questions_delete on public.product_questions
  for delete to authenticated
  using (user_id = auth.uid() or public.has_permission('content:write'));

create table public.product_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.product_questions (id) on delete cascade,
  answered_by_name text not null default 'Clink & Co Team',
  answered_by_user_id uuid references public.profiles (id) on delete set null,
  answer text not null check (char_length(answer) between 1 and 2000),
  helpful_count integer not null default 0 check (helpful_count >= 0),
  created_at timestamptz not null default now()
);

alter table public.product_answers enable row level security;

create policy product_answers_select on public.product_answers
  for select to authenticated, anon
  using (
    exists (select 1 from public.product_questions q where q.id = question_id and q.status = 'published')
    or public.has_permission('content:view')
  );

-- Staff-authored only — "Clink & Co Team" replies are not customer content.
create policy product_answers_write_staff on public.product_answers
  for all to authenticated
  using (public.has_permission('content:write'))
  with check (public.has_permission('content:write'));

-- ----------------------------------------------------------------------------
-- products.rating / review_count sync — recomputed from published reviews
-- only, so a pending/rejected review never moves the public-facing average.
-- ----------------------------------------------------------------------------
create or replace function public.sync_product_rating()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
  v_avg numeric(2, 1);
  v_count integer;
begin
  select round(avg(rating)::numeric, 1), count(*)
  into v_avg, v_count
  from public.reviews
  where product_id = v_product_id and status = 'published';

  update public.products
  set rating = v_avg,
      review_count = coalesce(v_count, 0)
  where id = v_product_id;

  return coalesce(new, old);
end;
$$;

create trigger reviews_sync_product_rating
  after insert or update or delete on public.reviews
  for each row execute function public.sync_product_rating();
