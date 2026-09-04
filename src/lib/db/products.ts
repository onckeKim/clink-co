import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable, NotFoundError } from "./errors";
import type { Database } from "@/lib/supabase/types";

type ProductRow = Database["public"]["Tables"]["products"]["Row"];
type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];
type ProductImageRow = Database["public"]["Tables"]["product_images"]["Row"];
type ProductVariantRow = Database["public"]["Tables"]["product_variants"]["Row"];

// Hand-authored types.ts has no `Relationships` metadata, so an embedded
// select like this one needs an explicit cast on the way out — see
// db/orders.ts's castEmbedded() for the identical rationale.
const PRODUCT_SELECT =
  "*, product_images(*), product_variants(*), product_categories(is_primary, categories(slug)), collection_products(collections(slug))";

export interface ProductFull extends ProductRow {
  product_images: ProductImageRow[];
  product_variants: ProductVariantRow[];
  product_categories: { is_primary: boolean; categories: { slug: string } | null }[];
  collection_products: { collections: { slug: string } | null }[];
}

function castEmbedded(rows: unknown): ProductFull[] {
  return rows as ProductFull[];
}
function castEmbeddedOne(row: unknown): ProductFull {
  return row as ProductFull;
}

/** Published, non-deleted products, newest first — mirrors what RLS (products_select_public) already restricts anon/authenticated to. */
export async function getPublishedProducts(): Promise<ProductFull[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("publish_status", "published")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });
  return castEmbedded(unwrap({ data, error }));
}

/** A single product by slug. RLS silently excludes a draft for a non-staff session (resolves null, so the page 404s normally); an admin session (products:view) resolves it too, for the preview-before-publishing PDP notice. */
export async function getProductBySlug(slug: string): Promise<ProductFull | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  const row = unwrapNullable({ data, error });
  return row ? castEmbeddedOne(row) : null;
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/products and /api/admin/products/**.
// ---------------------------------------------------------------------------

/** Every non-deleted product regardless of publish status — the admin product list. */
export async function listAllProducts(): Promise<ProductFull[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("products")
    .select(PRODUCT_SELECT)
    .is("deleted_at", null)
    .order("name", { ascending: true });
  return castEmbedded(unwrap({ data, error }));
}

export async function getProductById(id: string): Promise<ProductFull | null> {
  const db = await getDb();
  const { data, error } = await db.from("products").select(PRODUCT_SELECT).eq("id", id).is("deleted_at", null).maybeSingle();
  const row = unwrapNullable({ data, error });
  return row ? castEmbeddedOne(row) : null;
}

type Db = Awaited<ReturnType<typeof getDb>>;

async function replaceCategory(db: Db, productId: string, categoryId: string): Promise<void> {
  const del = await db.from("product_categories").delete().eq("product_id", productId);
  if (del.error) throw mapPostgrestError(del.error);
  const ins = await db.from("product_categories").insert({ product_id: productId, category_id: categoryId, is_primary: true });
  if (ins.error) throw mapPostgrestError(ins.error);
}

async function replaceCollections(db: Db, productId: string, collectionIds: string[]): Promise<void> {
  const del = await db.from("collection_products").delete().eq("product_id", productId);
  if (del.error) throw mapPostgrestError(del.error);
  if (collectionIds.length === 0) return;
  const rows = collectionIds.map((collection_id, i) => ({ collection_id, product_id: productId, sort_order: i }));
  const ins = await db.from("collection_products").insert(rows);
  if (ins.error) throw mapPostgrestError(ins.error);
}

export interface VariantWrite {
  label: string;
  priceDelta: number;
  swatch: string | null;
  isDefault: boolean;
  /** Image URLs scoped to this variant (falls back to the product's own images on the storefront when empty). */
  images: string[];
}

export interface ImageWrite {
  url: string;
  altText: string | null;
  isPrimary: boolean;
}

/**
 * Replaces every variant and image row for a product in one shot — the
 * admin form always edits the full variant/image lists together (never a
 * single variant in isolation), so "delete everything, re-insert what was
 * submitted" is simpler and just as correct as diffing. Variants are
 * inserted one at a time (not a bulk insert) because each one's own images
 * need its freshly-generated id as their variant_id.
 */
async function replaceVariantsAndImages(db: Db, productId: string, images: ImageWrite[], variants: VariantWrite[]): Promise<void> {
  // Deleting a variant cascades its own images (product_images.variant_id
  // has ON DELETE CASCADE) — clearing product_images first also removes
  // product-level images (variant_id null), which don't cascade from anything.
  const delImages = await db.from("product_images").delete().eq("product_id", productId);
  if (delImages.error) throw mapPostgrestError(delImages.error);
  const delVariants = await db.from("product_variants").delete().eq("product_id", productId);
  if (delVariants.error) throw mapPostgrestError(delVariants.error);

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const insVariant = await db
      .from("product_variants")
      .insert({ product_id: productId, label: v.label, price_delta: v.priceDelta, swatch: v.swatch, sort_order: i, is_default: v.isDefault })
      .select()
      .single();
    if (insVariant.error) throw mapPostgrestError(insVariant.error);
    if (v.images.length > 0) {
      const rows = v.images.map((url, j) => ({ product_id: productId, variant_id: insVariant.data.id, url, sort_order: j, is_primary: j === 0 }));
      const insImages = await db.from("product_images").insert(rows);
      if (insImages.error) throw mapPostgrestError(insImages.error);
    }
  }

  if (images.length > 0) {
    const rows = images.map((img, i) => ({ product_id: productId, url: img.url, alt_text: img.altText, sort_order: i, is_primary: img.isPrimary }));
    const insImages = await db.from("product_images").insert(rows);
    if (insImages.error) throw mapPostgrestError(insImages.error);
  }
}

/**
 * Writes the 'main' location's stock level. products.stock_quantity/in_stock
 * are denormalized columns the DB itself keeps in sync via
 * sync_product_stock() (a trigger on inventory) — this is the only place
 * that needs to touch stock, never the products row directly. No real
 * upsert here: the location's unique index is a coalesce() expression that
 * supabase-js's onConflict (a plain column list) can't target, so this
 * reads first and updates or inserts accordingly.
 *
 * `lowStockThreshold` undefined means "leave whatever this row already has
 * unchanged" (e.g. a save that only touched stock quantity) — only a new
 * row needs a default, since it has no existing value to keep.
 */
async function writeMainInventory(db: Db, productId: string, quantityOnHand: number, lowStockThreshold: number | null | undefined): Promise<void> {
  const existing = await db.from("inventory").select("id").eq("product_id", productId).is("variant_id", null).eq("location", "main").maybeSingle();
  if (existing.error) throw mapPostgrestError(existing.error);
  if (existing.data) {
    const patch: { quantity_on_hand: number; low_stock_threshold?: number } = { quantity_on_hand: quantityOnHand };
    if (lowStockThreshold !== undefined) patch.low_stock_threshold = lowStockThreshold ?? 5;
    const upd = await db.from("inventory").update(patch).eq("id", existing.data.id);
    if (upd.error) throw mapPostgrestError(upd.error);
  } else {
    const ins = await db.from("inventory").insert({ product_id: productId, variant_id: null, location: "main", quantity_on_hand: quantityOnHand, low_stock_threshold: lowStockThreshold ?? 5 });
    if (ins.error) throw mapPostgrestError(ins.error);
  }
}

export interface ProductWriteInput {
  product: ProductInsert;
  categoryId: string;
  collectionIds: string[];
  variants: VariantWrite[];
  images: ImageWrite[];
  stockQuantity: number;
}

export async function createProductFull(input: ProductWriteInput): Promise<ProductFull> {
  const db = await getDb();
  const insert = await db.from("products").insert(input.product).select().single();
  if (insert.error) throw mapPostgrestError(insert.error);
  const productId = insert.data.id;

  await replaceCategory(db, productId, input.categoryId);
  await replaceCollections(db, productId, input.collectionIds);
  await replaceVariantsAndImages(db, productId, input.images, input.variants);
  await writeMainInventory(db, productId, input.stockQuantity, input.product.low_stock_threshold);

  const full = await getProductById(productId);
  if (!full) throw new NotFoundError("Product not found after creation.");
  return full;
}

export interface ProductWritePatch {
  product?: ProductUpdate;
  categoryId?: string;
  collectionIds?: string[];
  /** variants and images are always replaced together — see replaceVariantsAndImages(). */
  catalogMedia?: { variants: VariantWrite[]; images: ImageWrite[] };
  stockQuantity?: number;
}

export async function updateProductFull(id: string, patch: ProductWritePatch): Promise<ProductFull> {
  const db = await getDb();

  if (patch.product && Object.keys(patch.product).length > 0) {
    const upd = await db.from("products").update(patch.product).eq("id", id);
    if (upd.error) throw mapPostgrestError(upd.error);
  }
  if (patch.categoryId !== undefined) await replaceCategory(db, id, patch.categoryId);
  if (patch.collectionIds !== undefined) await replaceCollections(db, id, patch.collectionIds);
  if (patch.catalogMedia) await replaceVariantsAndImages(db, id, patch.catalogMedia.images, patch.catalogMedia.variants);
  if (patch.stockQuantity !== undefined) {
    await writeMainInventory(db, id, patch.stockQuantity, patch.product?.low_stock_threshold);
  }

  const full = await getProductById(id);
  if (!full) throw new NotFoundError("Product not found after update.");
  return full;
}

/** Soft-delete only — order_items/reviews/inventory rows that reference this product keep their history; a hard DELETE would either cascade-destroy that history or be blocked by the FK, neither of which is what "archive" should mean. */
export async function archiveProduct(id: string): Promise<ProductRow> {
  const db = await getDb();
  const { data, error } = await db.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", id).select().single();
  return unwrap({ data, error });
}

export async function restoreProduct(id: string): Promise<ProductRow> {
  const db = await getDb();
  const { data, error } = await db.from("products").update({ deleted_at: null }).eq("id", id).select().single();
  return unwrap({ data, error });
}

/** Hard delete — only ever called after products-delete.ts confirms no order has referenced this product. */
export async function deleteProductRow(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("products").delete().eq("id", id);
  if (error) throw mapPostgrestError(error);
}

/** Resolves a set of product ids to their slugs — for a single-product read's Product.pairsWithSlugs, which stores the target as products.pairs_with_product_ids (uuid[]) rather than slugs. A list read already has every row's own slug in hand, so it builds this map itself instead of calling this. */
export async function getProductSlugsByIds(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const db = await getDb();
  const { data, error } = await db.from("products").select("id, slug").in("id", ids);
  const rows = unwrap({ data, error });
  return new Map(rows.map((r) => [r.id, r.slug]));
}
