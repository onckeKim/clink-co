import "server-only";
import { getDb } from "./client";
import { unwrap, unwrapNullable } from "./errors";
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
