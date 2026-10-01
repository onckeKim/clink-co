-- ============================================================================
-- Clink & Co by HEIMSIGHT — database schema
-- 0000: Extensions, ENUM types, and the generic `updated_at` trigger.
--
-- Migrations are numbered and applied in order by `supabase db push` /
-- `supabase migration up`. Each file after this one owns one cohesive slice
-- of the schema (its tables, indexes, constraints, RLS policies) so the
-- whole set can be read top-to-bottom as the system design. See
-- supabase/README.md for how to run these.
-- ============================================================================

-- gen_random_uuid() for every primary key; citext for case-insensitive email
-- columns (so "Jane@Example.com" and "jane@example.com" collide correctly on
-- uniqueness checks and lookups without the app having to remember to
-- lower() everywhere); pg_trgm backs fast ILIKE/fuzzy search on product and
-- customer text fields.
create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

-- ----------------------------------------------------------------------------
-- ENUM types. Small, stable vocabularies get a real Postgres ENUM (self-
-- documenting, rejects invalid values at the type level); larger/looser
-- vocabularies (product tags, badges) use a CHECK-constrained text[] instead
-- — see 0002_catalog.sql. Every one of these mirrors an existing TypeScript
-- union type in the app (named in each comment) so the DB and the app can
-- never drift silently.
-- ----------------------------------------------------------------------------

-- src/lib/admin/roles.ts — Role. "customer" is the default for every
-- shopper; the other six are the admin roles. A profile's `role` column and
-- `user_roles` rows both use this type — see 0001_identity_and_access.sql.
create type public.app_role as enum (
  'customer',
  'super_admin',
  'store_admin',
  'product_manager',
  'order_fulfilment',
  'content_editor',
  'customer_support'
);

-- src/lib/orders/types.ts — OrderStatus
create type public.order_status as enum (
  'pending_payment',
  'paid',
  'payment_failed',
  'cancelled',
  'fulfilled'
);

-- src/lib/orders/types.ts — PaymentMethodId
create type public.payment_method as enum (
  'test',
  'payfast',
  'peach',
  'yoco',
  'ozow',
  'eft'
);

-- The lifecycle of one payment attempt against an order (an order can have
-- more than one attempt, e.g. a retry after a decline) — see payments table.
create type public.payment_status as enum (
  'pending',
  'authorized',
  'succeeded',
  'failed',
  'refunded',
  'partially_refunded'
);

-- src/config/delivery.ts — DeliveryMethodId
create type public.delivery_method as enum (
  'standard',
  'express',
  'pickup'
);

create type public.shipment_status as enum (
  'pending',
  'in_transit',
  'delivered',
  'failed',
  'returned'
);

-- src/types/coupon.ts — Coupon.discountType
create type public.discount_type as enum (
  'percentage',
  'fixed'
);

-- Shared by every "admin can preview before going live" resource: products,
-- journal_posts. src/types/product.ts / src/types/content.ts —
-- publishStatus.
create type public.publish_status as enum (
  'draft',
  'published'
);

-- Shared moderation lifecycle for user-generated content: reviews and
-- product_questions. Public reads only ever see 'published'.
create type public.moderation_status as enum (
  'pending',
  'published',
  'rejected'
);

-- src/lib/account/returns-store.ts — ReturnRequest.status, extended with the
-- fuller lifecycle the store's own doc comment calls out as the real-world
-- target ("requested → approved → received → refunded").
create type public.return_status as enum (
  'requested',
  'approved',
  'rejected',
  'received',
  'refunded'
);

-- src/lib/account/returns-store.ts — ReturnReason
create type public.return_reason as enum (
  'changed-mind',
  'damaged',
  'wrong-item',
  'not-as-described',
  'other'
);

create type public.cart_status as enum (
  'active',
  'converted',
  'abandoned'
);

create type public.newsletter_status as enum (
  'subscribed',
  'unsubscribed'
);

create type public.contact_status as enum (
  'new',
  'in_progress',
  'resolved'
);

-- ----------------------------------------------------------------------------
-- Generic `updated_at` maintenance. Attached per-table in each migration via
-- `create trigger ... before update ... execute function set_updated_at()`.
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Generic BEFORE UPDATE trigger: stamps updated_at = now() on every row change. Attached per-table wherever updated_at exists.';
