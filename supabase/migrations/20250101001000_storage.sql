-- ============================================================================
-- 0010: Storage buckets — product/category/content/review images (public),
-- invoices and return-evidence (private). Every bucket enforces a file-size
-- limit and a MIME allowlist at the bucket level (Supabase/Postgres rejects
-- an oversized or wrong-type upload before it's ever stored, independent of
-- whatever the client-side uploader already checks — see
-- src/lib/admin/media-constants.ts's own comment on why the server side
-- must re-validate).
--
-- Path convention (enforced by the RLS policies below, not just documented):
--   product-images/{product_id}/{filename}
--   category-images/{category_id}/{filename}
--   content-images/{context}/{filename}          -- hero, journal, editorial, ...
--   review-images/{user_id}/{review_id}/{filename}
--   invoices/{order_id}/{filename}
--   return-evidence/{user_id}/{return_id}/{filename}
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('category-images', 'category-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('content-images', 'content-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
  ('review-images', 'review-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('invoices', 'invoices', false, 10485760, array['application/pdf']),
  ('return-evidence', 'return-evidence', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

-- ----------------------------------------------------------------------------
-- product-images — read: everyone. write: products:write.
-- ----------------------------------------------------------------------------
create policy product_images_bucket_select on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'product-images');

create policy product_images_bucket_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.has_permission('products:write'));

create policy product_images_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'product-images' and public.has_permission('products:write'))
  with check (bucket_id = 'product-images' and public.has_permission('products:write'));

create policy product_images_bucket_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-images' and public.has_permission('products:write'));

-- ----------------------------------------------------------------------------
-- category-images — read: everyone. write: categories:write.
-- ----------------------------------------------------------------------------
create policy category_images_bucket_select on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'category-images');

create policy category_images_bucket_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'category-images' and public.has_permission('categories:write'));

create policy category_images_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'category-images' and public.has_permission('categories:write'))
  with check (bucket_id = 'category-images' and public.has_permission('categories:write'));

create policy category_images_bucket_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'category-images' and public.has_permission('categories:write'));

-- ----------------------------------------------------------------------------
-- content-images — read: everyone. write: content:write.
-- ----------------------------------------------------------------------------
create policy content_images_bucket_select on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'content-images');

create policy content_images_bucket_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'content-images' and public.has_permission('content:write'));

create policy content_images_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'content-images' and public.has_permission('content:write'))
  with check (bucket_id = 'content-images' and public.has_permission('content:write'));

create policy content_images_bucket_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'content-images' and public.has_permission('content:write'));

-- ----------------------------------------------------------------------------
-- review-images — read: everyone (a review's photos are public once the
-- review is). write: the reviewing customer, into their own
-- `{auth.uid()}/...` folder only — `storage.foldername(name)` splits the
-- object path into an array of folder segments, so `[1]` is the first path
-- component. Moderation delete: content:write staff too.
-- ----------------------------------------------------------------------------
create policy review_images_bucket_select on storage.objects
  for select to authenticated, anon
  using (bucket_id = 'review-images');

create policy review_images_bucket_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'review-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy review_images_bucket_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'review-images'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_permission('content:write'))
  );

-- ----------------------------------------------------------------------------
-- invoices — private. A customer may read their own order's invoice; staff
-- with orders:view may read any. Nobody except the service role (the PDF-
-- generation Route Handler) ever writes here — invoices are system-
-- generated documents, never uploaded by a customer or edited afterward.
-- ----------------------------------------------------------------------------
create policy invoices_bucket_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'invoices'
    and (
      exists (
        select 1 from public.orders o
        where o.id::text = (storage.foldername(name))[1] and o.user_id = auth.uid()
      )
      or public.has_permission('orders:view')
    )
  );

-- ----------------------------------------------------------------------------
-- return-evidence — private. A customer uploads evidence only into their
-- own `{auth.uid()}/...` folder, for a return they own; staff with
-- orders:view may read it while working the request. Deletion is limited
-- to the request's 'requested' stage (matching return_items' own delete
-- rule) or staff with orders:fulfil.
-- ----------------------------------------------------------------------------
create policy return_evidence_bucket_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'return-evidence'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.has_permission('orders:view'))
  );

create policy return_evidence_bucket_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'return-evidence' and (storage.foldername(name))[1] = auth.uid()::text);

create policy return_evidence_bucket_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'return-evidence'
    and (
      (
        (storage.foldername(name))[1] = auth.uid()::text
        and exists (
          select 1 from public.returns r
          where r.id::text = (storage.foldername(name))[2] and r.status = 'requested'
        )
      )
      or public.has_permission('orders:fulfil')
    )
  );
