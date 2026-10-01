import "server-only";
import type { Product, ProductBadge, ProductVariant } from "@/types/product";
import * as db from "@/lib/db/products";
import type { ProductFull, VariantWrite, ImageWrite } from "@/lib/db/products";
import { ConflictError } from "@/lib/db/errors";
import type { Database } from "@/lib/supabase/types";
import { getCategoryBySlug } from "@/lib/admin/categories-store";
import { listAllCollections } from "@/lib/db/collections";

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductUpdate = Database["public"]["Tables"]["products"]["Update"];

/**
 * Async wrapper over src/lib/db/products.ts (the real `products` table plus
 * its variant/image/category/collection/inventory child tables).
 * Product.setSizeOptions is not persisted — there's no set_size_options
 * table in the schema (only the single `set_size` text column), so it's
 * always read back as undefined and the admin form has no way to set it,
 * same reasoning as Coupon.productSlugs in src/types/coupon.ts.
 */

const LOW_STOCK_THRESHOLD_DEFAULT = 6; // mirrors src/components/product/StockStatus.tsx

/**
 * Computes the effective `price`/`compareAtPrice` for "now" from a
 * product's authored regular/sale/schedule fields — ported unchanged from
 * the pre-DB in-memory store. The DB keeps regular_price/sale_price/
 * sale_starts_at/sale_ends_at as the admin authored them; it does not
 * itself flip price/compare_at_price at the schedule boundary (unlike
 * stock, which a trigger maintains), so this still has to run on every
 * read for a sale to activate/deactivate exactly on time.
 */
export function applyScheduledPricing(product: Product, now: Date = new Date()): Product {
  if (product.regularPrice === undefined) return product;
  const startsOk = !product.saleStartsAt || new Date(product.saleStartsAt) <= now;
  const endsOk = !product.saleEndsAt || new Date(product.saleEndsAt) >= now;
  const saleActive = product.salePrice !== undefined && startsOk && endsOk;
  return {
    ...product,
    price: saleActive ? product.salePrice! : product.regularPrice,
    compareAtPrice: saleActive ? product.regularPrice : undefined,
  };
}

function fromRow(row: ProductFull, idToSlug: Map<string, string>): Product {
  const primaryCategory = row.product_categories.find((pc) => pc.is_primary) ?? row.product_categories[0];
  const categorySlug = primaryCategory?.categories?.slug ?? "";
  const collectionSlugs = row.collection_products
    .map((cp) => cp.collections?.slug)
    .filter((slug): slug is string => Boolean(slug));

  const productImages = row.product_images
    .filter((img) => img.variant_id === null)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((img) => img.url);

  const variants = row.product_variants
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((v) => {
      const variantImages = row.product_images
        .filter((img) => img.variant_id === v.id)
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((img) => img.url);
      return {
        id: v.id,
        label: v.label,
        priceDelta: v.price_delta || undefined,
        swatch: v.swatch ?? undefined,
        images: variantImages.length ? variantImages : undefined,
      };
    });

  const pairsWithSlugs = row.pairs_with_product_ids
    .map((id) => idToSlug.get(id))
    .filter((slug): slug is string => Boolean(slug));

  const hasDimensions =
    row.dimensions_height_cm !== null && row.dimensions_width_cm !== null && row.dimensions_depth_cm !== null;

  const base: Product = {
    id: row.id,
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    shortDescription: row.short_description ?? "",
    description: row.description,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price !== null ? Number(row.compare_at_price) : undefined,
    currency: "ZAR",
    images: productImages,
    categorySlug,
    productType: row.product_type ?? "",
    collectionSlugs,
    material: row.material ?? undefined,
    colors: row.colors.length ? row.colors : undefined,
    capacity: row.capacity ?? undefined,
    setSize: row.set_size ?? undefined,
    stockQuantity: row.stock_quantity,
    inStock: row.in_stock,
    discontinued: row.discontinued,
    featured: row.featured,
    badges: row.badges.length ? (row.badges as ProductBadge[]) : undefined,
    variants: variants.length ? variants : undefined,
    videoUrl: row.video_url ?? undefined,
    rating: row.rating !== null ? Number(row.rating) : undefined,
    reviewCount: row.review_count,
    tags: row.tags,
    careInstructions: row.care_instructions,
    dimensions: hasDimensions
      ? { heightCm: Number(row.dimensions_height_cm), widthCm: Number(row.dimensions_width_cm), depthCm: Number(row.dimensions_depth_cm) }
      : undefined,
    weightGrams: row.weight_grams ?? undefined,
    keyBenefits: row.key_benefits.length ? row.key_benefits : undefined,
    lifestyleImage: row.lifestyle_image ?? undefined,
    lifestyleCaption: row.lifestyle_caption ?? undefined,
    pairsWithSlugs: pairsWithSlugs.length ? pairsWithSlugs : undefined,
    packagingInfo: row.packaging_info ?? undefined,
    publishStatus: row.publish_status,
    lowStockThreshold: row.low_stock_threshold ?? undefined,
    regularPrice: row.regular_price !== null ? Number(row.regular_price) : undefined,
    salePrice: row.sale_price !== null ? Number(row.sale_price) : undefined,
    saleStartsAt: row.sale_starts_at ?? undefined,
    saleEndsAt: row.sale_ends_at ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
  };

  return applyScheduledPricing(base);
}

function idToSlugMap(rows: ProductFull[]): Map<string, string> {
  return new Map(rows.map((r) => [r.id, r.slug]));
}

// ---------------------------------------------------------------------------
// Storefront-facing reads — identical names/signatures to the pre-admin
// src/data/products.ts, re-exported from there unchanged.
// ---------------------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  const rows = await db.getPublishedProducts();
  const idMap = idToSlugMap(rows);
  return rows.map((row) => fromRow(row, idMap));
}

/** Every listable product — not discontinued, not a draft (published rows are already all this store's getProducts() returns, since drafts/deleted are excluded by RLS/the query itself; this just also drops discontinued ones). */
export async function getActiveProducts(): Promise<Product[]> {
  const products = await getProducts();
  return products.filter((p) => !p.discontinued);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const row = await db.getProductBySlug(slug);
  if (!row) return undefined;
  const idMap = row.pairs_with_product_ids.length ? await db.getProductSlugsByIds(row.pairs_with_product_ids) : new Map<string, string>();
  return fromRow(row, idMap);
}

export async function getProductBySku(sku: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.sku.toLowerCase() === sku.toLowerCase());
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  const products = await getActiveProducts();
  return products.filter((p) => p.categorySlug === categorySlug);
}

export async function getProductsByCollection(collectionSlug: string): Promise<Product[]> {
  const products = await getActiveProducts();
  return products.filter((p) => p.collectionSlugs.includes(collectionSlug));
}

export async function getBestsellers(): Promise<Product[]> {
  const products = await getActiveProducts();
  return products.filter((p) => p.badges?.includes("Bestseller"));
}

export async function getNewArrivals(): Promise<Product[]> {
  const products = await getActiveProducts();
  return products.filter((p) => p.badges?.includes("New"));
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/products and /api/admin/products/**.
// ---------------------------------------------------------------------------

export interface AdminProductFilters {
  search?: string;
  categorySlug?: string;
  publishStatus?: "draft" | "published";
  stockLevel?: "in-stock" | "low-stock" | "out-of-stock";
}

export function getLowStockThreshold(product: Product): number {
  return product.lowStockThreshold ?? LOW_STOCK_THRESHOLD_DEFAULT;
}

export async function listAdminProducts(filters?: AdminProductFilters): Promise<Product[]> {
  const rows = await db.listAllProducts();
  const idMap = idToSlugMap(rows);
  let list = rows.map((row) => fromRow(row, idMap));

  if (filters?.search) {
    const q = filters.search.trim().toLowerCase();
    list = list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
    );
  }
  if (filters?.categorySlug) list = list.filter((p) => p.categorySlug === filters.categorySlug);
  if (filters?.publishStatus) list = list.filter((p) => (p.publishStatus ?? "published") === filters.publishStatus);
  if (filters?.stockLevel) {
    list = list.filter((p) => {
      const threshold = getLowStockThreshold(p);
      if (filters.stockLevel === "out-of-stock") return p.stockQuantity <= 0;
      if (filters.stockLevel === "low-stock") return p.stockQuantity > 0 && p.stockQuantity <= threshold;
      return p.stockQuantity > threshold;
    });
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAdminProductById(id: string): Promise<Product | undefined> {
  const row = await db.getProductById(id);
  if (!row) return undefined;
  const idMap = row.pairs_with_product_ids.length ? await db.getProductSlugsByIds(row.pairs_with_product_ids) : new Map<string, string>();
  return fromRow(row, idMap);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function resolveCategoryId(categorySlug: string): Promise<string> {
  const category = await getCategoryBySlug(categorySlug);
  if (!category) throw new ConflictError(`Unknown category: "${categorySlug}".`);
  return category.id;
}

async function resolveCollectionIds(collectionSlugs: string[] | undefined): Promise<string[]> {
  if (!collectionSlugs?.length) return [];
  const collections = await listAllCollections();
  const slugToId = new Map(collections.map((c) => [c.slug, c.id]));
  return collectionSlugs.map((slug) => slugToId.get(slug)).filter((id): id is string => Boolean(id));
}

async function resolvePairsWithIds(pairsWithSlugs: string[] | undefined): Promise<string[]> {
  if (!pairsWithSlugs?.length) return [];
  const products = await getProducts();
  const slugToId = new Map(products.map((p) => [p.slug, p.id]));
  return pairsWithSlugs.map((slug) => slugToId.get(slug)).filter((id): id is string => Boolean(id));
}

function toVariantWrites(variants: Product["variants"]): VariantWrite[] {
  if (!variants?.length) return [];
  return variants.map((v, i) => ({
    label: v.label,
    priceDelta: v.priceDelta ?? 0,
    swatch: v.swatch ?? null,
    isDefault: i === 0,
    images: v.images ?? [],
  }));
}

function toImageWrites(images: string[]): ImageWrite[] {
  return images.map((url, i) => ({ url, altText: null, isPrimary: i === 0 }));
}

export type CreateProductInput = Omit<Product, "id" | "slug" | "inStock"> & { slug?: string };

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const [categoryId, collectionIds, pairsWithIds] = await Promise.all([
    resolveCategoryId(input.categorySlug),
    resolveCollectionIds(input.collectionSlugs),
    resolvePairsWithIds(input.pairsWithSlugs),
  ]);

  const productInsert: ProductInsert = {
    slug: slugify(input.slug || input.name),
    sku: input.sku,
    name: input.name,
    short_description: input.shortDescription,
    description: input.description,
    price: input.price,
    compare_at_price: input.compareAtPrice ?? null,
    regular_price: input.regularPrice ?? null,
    sale_price: input.salePrice ?? null,
    sale_starts_at: input.saleStartsAt ?? null,
    sale_ends_at: input.saleEndsAt ?? null,
    product_type: input.productType,
    material: input.material ?? null,
    capacity: input.capacity ?? null,
    set_size: input.setSize ?? null,
    weight_grams: input.weightGrams ?? null,
    dimensions_height_cm: input.dimensions?.heightCm ?? null,
    dimensions_width_cm: input.dimensions?.widthCm ?? null,
    dimensions_depth_cm: input.dimensions?.depthCm ?? null,
    care_instructions: input.careInstructions,
    key_benefits: input.keyBenefits ?? [],
    tags: input.tags,
    colors: input.colors ?? [],
    badges: input.badges ?? [],
    pairs_with_product_ids: pairsWithIds,
    lifestyle_image: input.lifestyleImage ?? null,
    lifestyle_caption: input.lifestyleCaption ?? null,
    packaging_info: input.packagingInfo ?? null,
    video_url: input.videoUrl ?? null,
    low_stock_threshold: input.lowStockThreshold ?? null,
    featured: input.featured,
    discontinued: input.discontinued ?? false,
    publish_status: input.publishStatus ?? "draft",
    seo_title: input.seoTitle ?? null,
    seo_description: input.seoDescription ?? null,
  };

  const row = await db.createProductFull({
    product: productInsert,
    categoryId,
    collectionIds,
    variants: toVariantWrites(input.variants),
    images: toImageWrites(input.images),
    stockQuantity: input.stockQuantity,
  });

  const idMap = row.pairs_with_product_ids.length ? await db.getProductSlugsByIds(row.pairs_with_product_ids) : new Map<string, string>();
  return fromRow(row, idMap);
}

export type UpdateProductInput = Partial<Omit<Product, "id">>;

export async function updateProduct(id: string, patch: UpdateProductInput): Promise<Product | undefined> {
  const existing = await db.getProductById(id);
  if (!existing) return undefined;

  const productPatch: ProductUpdate = {};
  if (patch.slug !== undefined) productPatch.slug = slugify(patch.slug);
  if (patch.sku !== undefined) productPatch.sku = patch.sku;
  if (patch.name !== undefined) productPatch.name = patch.name;
  if (patch.shortDescription !== undefined) productPatch.short_description = patch.shortDescription;
  if (patch.description !== undefined) productPatch.description = patch.description;
  if (patch.price !== undefined) productPatch.price = patch.price;
  if (patch.compareAtPrice !== undefined) productPatch.compare_at_price = patch.compareAtPrice ?? null;
  if (patch.regularPrice !== undefined) productPatch.regular_price = patch.regularPrice ?? null;
  if (patch.salePrice !== undefined) productPatch.sale_price = patch.salePrice ?? null;
  if (patch.saleStartsAt !== undefined) productPatch.sale_starts_at = patch.saleStartsAt ?? null;
  if (patch.saleEndsAt !== undefined) productPatch.sale_ends_at = patch.saleEndsAt ?? null;
  if (patch.productType !== undefined) productPatch.product_type = patch.productType;
  if (patch.material !== undefined) productPatch.material = patch.material ?? null;
  if (patch.capacity !== undefined) productPatch.capacity = patch.capacity ?? null;
  if (patch.setSize !== undefined) productPatch.set_size = patch.setSize ?? null;
  if (patch.weightGrams !== undefined) productPatch.weight_grams = patch.weightGrams ?? null;
  if (patch.dimensions !== undefined) {
    productPatch.dimensions_height_cm = patch.dimensions?.heightCm ?? null;
    productPatch.dimensions_width_cm = patch.dimensions?.widthCm ?? null;
    productPatch.dimensions_depth_cm = patch.dimensions?.depthCm ?? null;
  }
  if (patch.careInstructions !== undefined) productPatch.care_instructions = patch.careInstructions;
  if (patch.keyBenefits !== undefined) productPatch.key_benefits = patch.keyBenefits ?? [];
  if (patch.tags !== undefined) productPatch.tags = patch.tags;
  if (patch.colors !== undefined) productPatch.colors = patch.colors ?? [];
  if (patch.badges !== undefined) productPatch.badges = patch.badges ?? [];
  if (patch.lifestyleImage !== undefined) productPatch.lifestyle_image = patch.lifestyleImage ?? null;
  if (patch.lifestyleCaption !== undefined) productPatch.lifestyle_caption = patch.lifestyleCaption ?? null;
  if (patch.packagingInfo !== undefined) productPatch.packaging_info = patch.packagingInfo ?? null;
  if (patch.videoUrl !== undefined) productPatch.video_url = patch.videoUrl ?? null;
  if (patch.lowStockThreshold !== undefined) productPatch.low_stock_threshold = patch.lowStockThreshold ?? null;
  if (patch.featured !== undefined) productPatch.featured = patch.featured;
  if (patch.discontinued !== undefined) productPatch.discontinued = patch.discontinued;
  if (patch.publishStatus !== undefined) productPatch.publish_status = patch.publishStatus;
  if (patch.seoTitle !== undefined) productPatch.seo_title = patch.seoTitle ?? null;
  if (patch.seoDescription !== undefined) productPatch.seo_description = patch.seoDescription ?? null;
  if (patch.pairsWithSlugs !== undefined) productPatch.pairs_with_product_ids = await resolvePairsWithIds(patch.pairsWithSlugs);

  const row = await db.updateProductFull(id, {
    product: productPatch,
    categoryId: patch.categorySlug !== undefined ? await resolveCategoryId(patch.categorySlug) : undefined,
    collectionIds: patch.collectionSlugs !== undefined ? await resolveCollectionIds(patch.collectionSlugs) : undefined,
    catalogMedia:
      patch.variants !== undefined || patch.images !== undefined
        ? {
            variants: toVariantWrites(patch.variants !== undefined ? patch.variants : existing.product_variants.map(variantRowToProductVariant)),
            images: toImageWrites(patch.images !== undefined ? patch.images : existing.product_images.filter((i) => i.variant_id === null).map((i) => i.url)),
          }
        : undefined,
    stockQuantity: patch.stockQuantity,
  });

  const idMap = row.pairs_with_product_ids.length ? await db.getProductSlugsByIds(row.pairs_with_product_ids) : new Map<string, string>();
  return fromRow(row, idMap);
}

function variantRowToProductVariant(v: Database["public"]["Tables"]["product_variants"]["Row"]): ProductVariant {
  return { id: v.id, label: v.label, priceDelta: v.price_delta || undefined, swatch: v.swatch ?? undefined };
}

/** "Archive" reuses the existing `discontinued` flag — retired, hidden from listings, PDP still reachable directly. There's no separate archive status; this is the same lifecycle state the pre-admin catalog already had a field for. */
export async function archiveProduct(id: string): Promise<Product | undefined> {
  return updateProduct(id, { discontinued: true });
}

export async function restoreProduct(id: string): Promise<Product | undefined> {
  return updateProduct(id, { discontinued: false });
}

export async function duplicateProduct(id: string): Promise<Product | undefined> {
  const existing = await getAdminProductById(id);
  if (!existing) return undefined;

  return createProduct({
    ...existing,
    slug: `${existing.slug}-copy`,
    name: `${existing.name} (Copy)`,
    sku: `${existing.sku}-COPY`,
    publishStatus: "draft",
  });
}

/**
 * Removes the product record with no cross-store checks. The "refuse to
 * delete a product referenced by a past order" safety check lives in
 * src/lib/admin/products-delete.ts instead, which calls this and is only
 * ever imported from the admin DELETE route.
 */
export async function removeProductRecord(id: string): Promise<void> {
  await db.deleteProductRow(id);
}
