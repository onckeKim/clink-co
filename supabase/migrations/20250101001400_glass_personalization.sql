-- ============================================================================
-- 0014: Glass personalization — lets a customer attach custom wording and/or
-- a reference photo to a cart line, carried through to the order line at
-- checkout for fulfillment staff to read. Reference-only: nothing here is
-- validated against product content, priced, or gated behind moderation —
-- see src/store/cart-store.ts and src/lib/db/orders.ts for how it's used.
-- ============================================================================

alter table public.cart_items
  add column personalization_text text,
  add column personalization_image_url text,
  add constraint cart_items_personalization_text_length
    check (personalization_text is null or char_length(personalization_text) <= 200);

alter table public.order_items
  add column personalization_text text,
  add column personalization_image_url text,
  add constraint order_items_personalization_text_length
    check (personalization_text is null or char_length(personalization_text) <= 200);
