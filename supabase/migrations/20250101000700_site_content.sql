-- ============================================================================
-- 0007: Site content — homepage_sections, hero_slides, journal_posts,
-- store_settings, media_assets.
-- ============================================================================

create table public.homepage_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index homepage_sections_sort_order_idx on public.homepage_sections (sort_order);

create trigger homepage_sections_set_updated_at
  before update on public.homepage_sections
  for each row execute function public.set_updated_at();

alter table public.homepage_sections enable row level security;

create policy homepage_sections_select_public on public.homepage_sections
  for select to authenticated, anon
  using (is_visible);

create policy homepage_sections_select_staff on public.homepage_sections
  for select to authenticated
  using (public.has_permission('content:view'));

create policy homepage_sections_write_staff on public.homepage_sections
  for all to authenticated
  using (public.has_permission('content:write'))
  with check (public.has_permission('content:write'));

-- ----------------------------------------------------------------------------
create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  eyebrow text,
  heading text not null check (char_length(heading) between 1 and 200),
  copy text,
  image text not null,
  image_alt text,
  primary_cta_label text,
  primary_cta_href text,
  secondary_cta_label text,
  secondary_cta_href text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index hero_slides_sort_order_idx on public.hero_slides (sort_order) where is_active;

create trigger hero_slides_set_updated_at
  before update on public.hero_slides
  for each row execute function public.set_updated_at();

alter table public.hero_slides enable row level security;

create policy hero_slides_select_public on public.hero_slides
  for select to authenticated, anon
  using (is_active);

create policy hero_slides_select_staff on public.hero_slides
  for select to authenticated
  using (public.has_permission('content:view'));

create policy hero_slides_write_staff on public.hero_slides
  for all to authenticated
  using (public.has_permission('content:write'))
  with check (public.has_permission('content:write'));

-- ----------------------------------------------------------------------------
create table public.journal_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 200),
  excerpt text,
  -- One array entry per paragraph — rendered as separate <p> blocks,
  -- matching src/types/content.ts's JournalArticle.body: string[].
  body text[] not null default '{}',
  cover_image text,
  cover_image_alt text,
  author_name text not null default 'Clink & Co Team',
  author_id uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  publish_status public.publish_status not null default 'draft',
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index journal_posts_publish_status_idx on public.journal_posts (publish_status);
create index journal_posts_published_at_idx on public.journal_posts (published_at desc) where publish_status = 'published';

create trigger journal_posts_set_updated_at
  before update on public.journal_posts
  for each row execute function public.set_updated_at();

alter table public.journal_posts enable row level security;

-- Public sees only published posts; a draft resolves at its slug for a
-- signed-in admin only (the "preview before publishing" precedent) — see
-- src/app/journal/[slug]/page.tsx's existing draft-notice banner, which
-- this row policy backs.
create policy journal_posts_select_public on public.journal_posts
  for select to authenticated, anon
  using (publish_status = 'published');

create policy journal_posts_select_staff on public.journal_posts
  for select to authenticated
  using (public.has_permission('content:view'));

create policy journal_posts_write_staff on public.journal_posts
  for all to authenticated
  using (public.has_permission('content:write'))
  with check (public.has_permission('content:write'));

-- ----------------------------------------------------------------------------
-- store_settings — a genuine singleton: `id boolean primary key default
-- true check (id)` means a second row (id would have to be `false`, which
-- the CHECK rejects) can never be inserted. Nothing in this row is a
-- secret — API keys/credentials for payment and email providers live in
-- server-only environment variables (see src/lib/payments/providers/*.ts),
-- never in this table — so the whole row is publicly readable; only
-- settings:write can change it.
-- ----------------------------------------------------------------------------
create table public.store_settings (
  id boolean primary key default true check (id),
  business_name text not null default 'Clink & Co by HEIMSIGHT',
  logo_url text,
  contact_email citext not null,
  contact_phone text,
  currency text not null default 'ZAR' check (currency = 'ZAR'),
  tax_rate_percent numeric(5, 2) not null default 15 check (tax_rate_percent between 0 and 100),
  free_delivery_threshold numeric(10, 2) not null default 0 check (free_delivery_threshold >= 0),
  enabled_delivery_method_ids public.delivery_method[] not null default array['standard', 'express', 'pickup']::public.delivery_method[],
  enabled_payment_method_ids public.payment_method[] not null default '{}',
  email_sender_name text,
  email_sender_local_part text,
  order_notification_email citext,
  social jsonb not null default '{}'::jsonb,
  order_number_prefix text not null default 'CC' check (order_number_prefix ~ '^[A-Z]{2,5}$'),
  return_window_days integer not null default 30 check (return_window_days >= 0),
  maintenance_mode boolean not null default false,
  maintenance_message text,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles (id) on delete set null
);

create trigger store_settings_set_updated_at
  before update on public.store_settings
  for each row execute function public.set_updated_at();

alter table public.store_settings enable row level security;

create policy store_settings_select_all on public.store_settings
  for select to authenticated, anon
  using (true);

create policy store_settings_update_staff on public.store_settings
  for update to authenticated
  using (public.has_permission('settings:write'))
  with check (public.has_permission('settings:write'));

-- No insert/delete policy: the one row is created below and lives forever.
insert into public.store_settings (id, contact_email) values (true, 'hello@clinkandco.com');

-- ----------------------------------------------------------------------------
-- media_assets — the admin media library. Not a public table: the
-- storefront only ever renders a `url` already embedded on a product/
-- category/hero slide/etc. row (all denormalized, set when an admin picks
-- an image); nobody browses the library itself except staff.
-- ----------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  storage_bucket text not null check (storage_bucket in (
    'product-images', 'category-images', 'content-images', 'review-images', 'invoices', 'return-evidence'
  )),
  storage_path text not null,
  -- Public URL, for a public bucket; null for a private bucket (invoices,
  -- return-evidence), where a signed URL is minted on read instead of
  -- stored — see src/lib/db/storage.ts.
  url text,
  filename text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  alt_text text,
  folder text,
  labels text[] not null default '{}',
  uploaded_by uuid references public.profiles (id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (storage_bucket, storage_path)
);

create index media_assets_folder_idx on public.media_assets (folder) where deleted_at is null;

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

alter table public.media_assets enable row level security;

create policy media_assets_select_staff on public.media_assets
  for select to authenticated
  using (public.has_permission('media:view'));

create policy media_assets_write_staff on public.media_assets
  for all to authenticated
  using (public.has_permission('media:write'))
  with check (public.has_permission('media:write'));
