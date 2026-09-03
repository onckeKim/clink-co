import "server-only";
import { getDb } from "./client";
import { unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

export interface ProductWithImages extends ProductRow {
  product_images: ProductImageRow[];
}

// Hand-authored types.ts has no `Relationships` metadata (that's what a
// real `supabase gen types` output encodes per table, and what lets
// supabase-js infer an embedded select's shape automatically) — so a
// nested select like this one needs an explicit cast on the way out. Once
// you run real codegen against a live project, these casts become
// unnecessary (and a type error would tell you so).
const PRODUCT_SELECT = "*, product_images(*)";

/**
 * Published, non-deleted products, newest first. This filter mirrors what
 * RLS already restricts anon/authenticated to (products_select_public in
 * supabase/migrations/20250101000200_catalog.sql) — repeating it here
 * isn't the security boundary, it's just so the query can use the
 * products_publish_status_idx index and read intention-revealingly.
 */
export async function getPublishedProducts(): Promise<ProductWithImages[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("publish_status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return unwrap({ data, error }) as unknown as ProductWithImages[];
}

/**
 * A single product by slug. For a signed-out or customer session, RLS
 * silently excludes a draft row — this returns `null`, not an error, so a
 * page can 404 normally. For a signed-in admin session (products:view),
 * the same query resolves the draft too, which is the "preview before
 * publishing" behavior — see the draft-notice banner this backs on the PDP.
 */
export async function getProductBySlug(slug: string): Promise<ProductWithImages | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  return unwrapNullable({ data, error }) as unknown as ProductWithImages | null;
}

/** Admin create. RLS (products:write) is the real gate — this throws PermissionError if the caller's session doesn't hold it, same as any other write here. */
export async function createProduct(input: ProductInsert): Promise<ProductRow> {
  const db = await getDb();
  const { data, error } = await db.from("products").insert(input).select().single();
  return unwrap({ data, error });
}

export async function updateProduct(id: string, patch: ProductUpdate): Promise<ProductRow> {
  const db = await getDb();
  const { data, error } = await db.from("products").update(patch).eq("id", id).select().single();
  return unwrap({ data, error });
}

/** Soft-delete only — order_items/reviews/inventory rows that reference this product keep their history; a hard DELETE would either cascade-destroy that history or be blocked by the FK, neither of which is what "archive" should mean. */
export async function archiveProduct(id: string): Promise<ProductRow> {
  return updateProduct(id, { deleted_at: new Date().toISOString() });
}

export async function restoreProduct(id: string): Promise<ProductRow> {
  return updateProduct(id, { deleted_at: null });
}
