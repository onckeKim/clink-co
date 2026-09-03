-- ============================================================================
-- 0013: store_settings gains abandoned_cart_enabled / abandoned_cart_delay_hours
-- — an existing admin-configurable feature (src/lib/email/abandoned-cart.ts,
-- src/types/settings.ts) that 0007_site_content.sql's store_settings table
-- never had columns for. Found while wiring settings-store.ts to this table.
-- ============================================================================
alter table public.store_settings
  add column abandoned_cart_enabled boolean not null default false,
  add column abandoned_cart_delay_hours integer not null default 24 check (abandoned_cart_delay_hours > 0);
