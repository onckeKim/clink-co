-- ============================================================================
-- 0002: Catalog — categories, collections, products, variants, images,
-- their junction tables, and inventory.
--
-- Public visibility rule for this whole file: anonymous and signed-in
-- shoppers alike may only ever SELECT published, non-deleted rows; admins
-- (via has_permission) see everything, including drafts, for the
-- preview-before-publish workflow documented on src/types/product.ts.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  description text,
  image text,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  is_published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- item_count (src/types/category.ts) is deliberately NOT a stored column —
-- it's a live count of published products in the category, computed by the
-- data-access layer (see src/lib/db/categories.ts) so it can never drift
-- from the products it's counting.

create index categories_sort_order_idx on public.categories (sort_order) where deleted_at is null;
create index categories_published_idx on public.categories (is_published) where deleted_at is null;

create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

alter table public.categories enable row level security;

create policy categories_select_public on public.categories
  for select to authenticated, anon
  using (is_published and deleted_at is null);

create policy categories_select_staff on public.categories
  for select to authenticated
  using (public.has_permission('categories:view'));

create policy categories_write_staff on public.categories
  for insert to authenticated
  with check (public.has_permission('categories:write'));

create policy categories_update_staff on public.categories
  for update to authenticated
  using (public.has_permission('categories:write'))
  with check (public.has_permission('categories:write'));

create policy categories_delete_staff on public.categories
  for delete to authenticated
  using (public.has_permission('categories:write'));

-- ----------------------------------------------------------------------------
-- collections (CuratedCollection)
-- ----------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 1 and 120),
  description text,
  image text,
  sort_order integer not null default 0,
  seo_title text,
  seo_description text,
  is_published boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- href (src/types/collection.ts) is derivable as `/collections/{slug}` —
-- not stored, computed by the data-access layer, same reasoning as
-- categories.item_count above.

create index collections_published_idx on public.collections (is_published) where deleted_at is null;

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

alter table public.collections enable row level security;

create policy collections_select_public on public.collections
  for select to authenticated, anon
  using (is_published and deleted_at is null);

create policy collections_select_staff on public.collections
  for select to authenticated
  using (public.has_permission('collections:view'));

create policy collections_write_staff on public.collections
  for insert to authenticated
  with check (public.has_permission('collections:write'));

create policy collections_update_staff on public.collections
  for update to authenticated
  using (public.has_permission('collections:write'))
  with check (public.has_permission('collections:write'));

create policy collections_delete_staff on public.collections
  for delete to authenticated
  using (public.has_permission('collections:write'));

-- A generated column's expression must be strictly IMMUTABLE, but
-- to_tsvector(regconfig, text) is only STABLE (the text-search config it
-- names is technically a catalog lookup) — the standard, widely-used
-- workaround is a thin wrapper that asserts immutability for a config that,
-- in practice, never changes underneath a running database.
create or replace function public.immutable_english_tsvector(input text)
returns tsvector
language sql
immutable
parallel safe
as $$
  select to_tsvector('english', coalesce(input, ''));
$$;

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  sku text not null unique check (char_length(sku) between 2 and 40),
  name text not null check (char_length(name) between 1 and 200),
  short_description text,
  description text not null,
  currency text not null default 'ZAR' check (currency = 'ZAR'),

  price numeric(10, 2) not null check (price >= 0),
  compare_at_price numeric(10, 2) check (compare_at_price is null or compare_at_price >= price),
  -- Scheduled-sale support (src/types/product.ts saleStartsAt/saleEndsAt):
  -- when set, `price`/`compare_at_price` above are kept in sync with these
  -- by the application at write time (matching the existing
  -- applyScheduledPricing() logic in src/lib/admin/products-store.ts);
  -- storing both lets a scheduled sale be authored ahead of time without
  -- touching the live selling price until the window opens.
  regular_price numeric(10, 2) check (regular_price is null or regular_price >= 0),
  sale_price numeric(10, 2) check (sale_price is null or sale_price >= 0),
  sale_starts_at timestamptz,
  sale_ends_at timestamptz,

  product_type text,
  material text,
  capacity text,
  set_size text,
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  dimensions_height_cm numeric(6, 2) check (dimensions_height_cm is null or dimensions_height_cm >= 0),
  dimensions_width_cm numeric(6, 2) check (dimensions_width_cm is null or dimensions_width_cm >= 0),
  dimensions_depth_cm numeric(6, 2) check (dimensions_depth_cm is null or dimensions_depth_cm >= 0),

  care_instructions text[] not null default '{}',
  key_benefits text[] not null default '{}',
  tags text[] not null default '{}',
  colors text[] not null default '{}',
  badges text[] not null default '{}'
    check (badges <@ array['New', 'Bestseller', 'Limited', 'Gift Edit']::text[]),
  pairs_with_product_ids uuid[] not null default '{}',

  lifestyle_image text,
  lifestyle_caption text,
  packaging_info text,
  video_url text,

  -- Denormalized aggregates, maintained by triggers — never written
  -- directly by the app. rating/review_count from reviews
  -- (0006_ugc.sql); stock_quantity/in_stock from inventory (below).
  rating numeric(2, 1) check (rating is null or rating between 0 and 5),
  review_count integer not null default 0 check (review_count >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  in_stock boolean not null default false,
  low_stock_threshold integer check (low_stock_threshold is null or low_stock_threshold >= 0),

  featured boolean not null default false,
  discontinued boolean not null default false,
  publish_status public.publish_status not null default 'draft',
  seo_title text,
  seo_description text,

  deleted_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint sale_window_order check (sale_ends_at is null or sale_starts_at is null or sale_ends_at > sale_starts_at),

  -- tags is deliberately not folded in here: array_to_string() is only
  -- STABLE (not IMMUTABLE, the requirement for a generated column), and
  -- tag filtering already has its own GIN index (products_tags_idx, below)
  -- — a search that also wants to weight tag matches can query both.
  search_vector tsvector generated always as (
    setweight(public.immutable_english_tsvector(name), 'A') ||
    setweight(public.immutable_english_tsvector(sku), 'A') ||
    setweight(public.immutable_english_tsvector(short_description), 'B') ||
    setweight(public.immutable_english_tsvector(description), 'C')
  ) stored
);

comment on column public.products.stock_quantity is
  'Denormalized sum of inventory.quantity_on_hand - quantity_reserved across all rows for this product. Maintained by sync_product_stock() — never write directly.';

create index products_publish_status_idx on public.products (publish_status) where deleted_at is null;
create index products_featured_idx on public.products (featured) where deleted_at is null and publish_status = 'published';
create index products_price_idx on public.products (price);
create index products_created_at_idx on public.products (created_at desc);
create index products_tags_idx on public.products using gin (tags);
create index products_colors_idx on public.products using gin (colors);
create index products_search_idx on public.products using gin (search_vector);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

alter table public.products enable row level security;

create policy products_select_public on public.products
  for select to authenticated, anon
  using (publish_status = 'published' and deleted_at is null);

create policy products_select_staff on public.products
  for select to authenticated
  using (public.has_permission('products:view'));

create policy products_write_staff on public.products
  for insert to authenticated
  with check (public.has_permission('products:write'));

create policy products_update_staff on public.products
  for update to authenticated
  using (public.has_permission('products:write'))
  with check (public.has_permission('products:write'));

create policy products_delete_staff on public.products
  for delete to authenticated
  using (public.has_permission('products:write'));

-- ----------------------------------------------------------------------------
-- product_categories — many-to-many, with one designated primary category
-- per product (src/types/product.ts's `categorySlug` is the primary).
-- ----------------------------------------------------------------------------
create table public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (product_id, category_id)
);

create unique index product_categories_one_primary on public.product_categories (product_id) where is_primary;
create index product_categories_category_id_idx on public.product_categories (category_id);

alter table public.product_categories enable row level security;

create policy product_categories_select_public on public.product_categories
  for select to authenticated, anon
  using (
    exists (select 1 from public.products p where p.id = product_id and p.publish_status = 'published' and p.deleted_at is null)
    and exists (select 1 from public.categories c where c.id = category_id and c.is_published and c.deleted_at is null)
  );

create policy product_categories_select_staff on public.product_categories
  for select to authenticated
  using (public.has_permission('products:view'));

create policy product_categories_write_staff on public.product_categories
  for all to authenticated
  using (public.has_permission('products:write'))
  with check (public.has_permission('products:write'));

-- ----------------------------------------------------------------------------
-- collection_products — many-to-many, admin-ordered per collection.
-- ----------------------------------------------------------------------------
create table public.collection_products (
  collection_id uuid not null references public.collections (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (collection_id, product_id)
);

create index collection_products_product_id_idx on public.collection_products (product_id);

alter table public.collection_products enable row level security;

create policy collection_products_select_public on public.collection_products
  for select to authenticated, anon
  using (
    exists (select 1 from public.products p where p.id = product_id and p.publish_status = 'published' and p.deleted_at is null)
    and exists (select 1 from public.collections c where c.id = collection_id and c.is_published and c.deleted_at is null)
  );

create policy collection_products_select_staff on public.collection_products
  for select to authenticated
  using (public.has_permission('collections:view'));

create policy collection_products_write_staff on public.collection_products
  for all to authenticated
  using (public.has_permission('collections:write'))
  with check (public.has_permission('collections:write'));

-- ----------------------------------------------------------------------------
-- product_variants
-- ----------------------------------------------------------------------------
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  sku text unique,
  price_delta numeric(10, 2) not null default 0,
  swatch text,
  sort_order integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, label)
);

create unique index product_variants_one_default on public.product_variants (product_id) where is_default;
create index product_variants_product_id_idx on public.product_variants (product_id);

create trigger product_variants_set_updated_at
  before update on public.product_variants
  for each row execute function public.set_updated_at();

alter table public.product_variants enable row level security;

create policy product_variants_select_public on public.product_variants
  for select to authenticated, anon
  using (exists (select 1 from public.products p where p.id = product_id and p.publish_status = 'published' and p.deleted_at is null));

create policy product_variants_select_staff on public.product_variants
  for select to authenticated
  using (public.has_permission('products:view'));

create policy product_variants_write_staff on public.product_variants
  for all to authenticated
  using (public.has_permission('products:write'))
  with check (public.has_permission('products:write'));

-- ----------------------------------------------------------------------------
-- product_images — product-level by default, optionally scoped to a
-- variant (src/types/product.ts's ProductVariant.images fallback pattern).
-- ----------------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  url text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  constraint variant_belongs_to_product check (variant_id is null or product_id is not null)
);

-- One primary image per product (variant_id is null), and one per variant.
create unique index product_images_one_primary_product on public.product_images (product_id) where is_primary and variant_id is null;
create unique index product_images_one_primary_variant on public.product_images (variant_id) where is_primary and variant_id is not null;
create index product_images_product_id_idx on public.product_images (product_id, sort_order);

alter table public.product_images enable row level security;

create policy product_images_select_public on public.product_images
  for select to authenticated, anon
  using (exists (select 1 from public.products p where p.id = product_id and p.publish_status = 'published' and p.deleted_at is null));

create policy product_images_select_staff on public.product_images
  for select to authenticated
  using (public.has_permission('products:view'));

create policy product_images_write_staff on public.product_images
  for all to authenticated
  using (public.has_permission('products:write'))
  with check (public.has_permission('products:write'));

-- ----------------------------------------------------------------------------
-- inventory — the stock ledger. One row per (product, variant, location);
-- products.stock_quantity/in_stock are a denormalized sum kept current by
-- sync_product_stock() so every existing storefront read of those two
-- columns keeps working unchanged. Deliberately NOT publicly readable in
-- its raw form (quantity_reserved and per-location detail are internal
-- operations data) — the storefront gets stock signal from
-- products.in_stock/stock_quantity instead, exactly as it does today.
-- ----------------------------------------------------------------------------
create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id) on delete cascade,
  location text not null default 'main',
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  quantity_reserved integer not null default 0 check (quantity_reserved >= 0 and quantity_reserved <= quantity_on_hand),
  quantity_available integer generated always as (quantity_on_hand - quantity_reserved) stored,
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Treats variant_id NULL as its own distinct slot per (product, location) —
-- Postgres unique indexes already treat NULL as distinct from other NULLs
-- by default, so a bare unique(product_id, variant_id, location) would
-- wrongly allow duplicate variant_id=NULL rows for the same product;
-- coalescing to a nil UUID sentinel avoids that.
create unique index inventory_product_variant_location_key
  on public.inventory (product_id, coalesce(variant_id, '00000000-0000-0000-0000-000000000000'::uuid), location);
create index inventory_product_id_idx on public.inventory (product_id);
create index inventory_low_stock_idx on public.inventory (product_id) where quantity_available <= low_stock_threshold;

create trigger inventory_set_updated_at
  before update on public.inventory
  for each row execute function public.set_updated_at();

create or replace function public.sync_product_stock()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_product_id uuid := coalesce(new.product_id, old.product_id);
  v_total integer;
begin
  select coalesce(sum(quantity_on_hand - quantity_reserved), 0)
  into v_total
  from public.inventory
  where product_id = v_product_id;

  update public.products
  set stock_quantity = v_total,
      in_stock = v_total > 0
  where id = v_product_id;

  return coalesce(new, old);
end;
$$;

create trigger inventory_sync_product_stock
  after insert or update or delete on public.inventory
  for each row execute function public.sync_product_stock();

alter table public.inventory enable row level security;

create policy inventory_select_staff on public.inventory
  for select to authenticated
  using (public.has_permission('products:view'));

create policy inventory_write_staff on public.inventory
  for all to authenticated
  using (public.has_permission('products:write'))
  with check (public.has_permission('products:write'));
