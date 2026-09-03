import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

export interface CollectionWithHref extends CollectionRow {
  /** Derivable as `/collections/{slug}` — not a stored column, same reasoning as categories.item_count. */
  href: string;
}

function withHref(row: CollectionRow): CollectionWithHref {
  return { ...row, href: `/collections/${row.slug}` };
}

export async function getCollections(): Promise<CollectionWithHref[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("collections")
    .select("*")
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  return unwrap({ data, error }).map(withHref);
}

export async function getCollectionBySlug(slug: string): Promise<CollectionWithHref | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("collections")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .maybeSingle();
  const row = unwrapNullable({ data, error });
  return row ? withHref(row) : null;
}

/** Product ids belonging to a collection, in admin-set order — join against getPublishedProducts()/getProductBySlug() at the call site rather than embedding here, so this stays a single, cacheable query. */
export async function getCollectionProductIds(collectionId: string): Promise<string[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("collection_products")
    .select("product_id")
    .eq("collection_id", collectionId)
    .order("sort_order", { ascending: true });
  return unwrap({ data, error }).map((row) => row.product_id);
}

/**
 * Admin lookup by slug (not the internal uuid `id`) — CuratedCollection.id
 * (src/types/collection.ts) has always doubled as the /collections/[id]
 * route slug and the value stored in Product.collectionSlugs, and is
 * immutable after creation (see updateCollection's patch type below), so
 * every admin operation keys off it exactly like the storefront reads do,
 * with no is_published filter (admins see drafts).
 */
export async function getCollectionById(slug: string): Promise<CollectionWithHref | null> {
  const db = await getDb();
  const { data, error } = await db.from("collections").select("*").eq("slug", slug).is("deleted_at", null).maybeSingle();
  const row = unwrapNullable({ data, error });
  return row ? withHref(row) : null;
}

/** Every non-deleted collection regardless of publish status — the admin collection list. */
export async function listAllCollections(): Promise<CollectionWithHref[]> {
  const db = await getDb();
  const { data, error } = await db.from("collections").select("*").is("deleted_at", null).order("sort_order", { ascending: true });
  return unwrap({ data, error }).map(withHref);
}

export async function createCollection(input: {
  slug: string;
  name: string;
  description: string;
  image: string;
}): Promise<CollectionWithHref> {
  const db = await getDb();
  const { data, error } = await db
    .from("collections")
    .insert({ slug: input.slug, name: input.name, description: input.description, image: input.image })
    .select()
    .single();
  return withHref(unwrap({ data, error }));
}

export async function updateCollection(
  slug: string,
  patch: Partial<{ name: string; description: string; image: string }>,
): Promise<CollectionWithHref> {
  const db = await getDb();
  const { data, error } = await db.from("collections").update(patch).eq("slug", slug).select().single();
  return withHref(unwrap({ data, error }));
}

export async function deleteCollection(slug: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("collections").delete().eq("slug", slug);
  if (error) throw mapPostgrestError(error);
}
