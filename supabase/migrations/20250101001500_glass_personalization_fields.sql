-- ============================================================================
-- 0015: Glass personalization, take two — replaces the freeform
-- personalization_text/personalization_image_url pair (0014) with the
-- structured fields the real KEEPS etching service actually offers: a
-- name or initials, an optional short title/message, and an optional
-- date. No reference photo — etching is text-only. Reference-only for
-- fulfillment staff, same as before: nothing here is validated against
-- product content, priced, or gated behind moderation — see
-- src/store/cart-store.ts and src/lib/db/orders.ts for how it's used.
-- ============================================================================

alter table public.cart_items
  drop constraint if exists cart_items_personalization_text_length,
  drop column if exists personalization_text,
  drop column if exists personalization_image_url,
  add column personalization_name text check (personalization_name is null or char_length(personalization_name) <= 40),
  add column personalization_message text check (personalization_message is null or char_length(personalization_message) <= 60),
  add column personalization_date date;

alter table public.order_items
  drop constraint if exists order_items_personalization_text_length,
  drop column if exists personalization_text,
  drop column if exists personalization_image_url,
  add column personalization_name text check (personalization_name is null or char_length(personalization_name) <= 40),
  add column personalization_message text check (personalization_message is null or char_length(personalization_message) <= 60),
  add column personalization_date date;
