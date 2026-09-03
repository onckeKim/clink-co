import type { Product } from "@/types/product";
import { productsSeed } from "@/data/products-seed";

/**
 * In-memory products store — a development/demo substitute for a real
 * `products` table, same rationale as every other store in this codebase.
 * This is the single source of truth for product data: src/data/products.ts
 * re-exports the storefront-facing functions below unchanged (same names,
 * same signatures), so every existing call site across the storefront
 * keeps working, and now reads whatever the admin dashboard last wrote —
 * that's the whole mechanism behind "admin edits appear on the storefront
 * without a redeploy" (see the README's admin section).
 */

const LOW_STOCK_THRESHOLD_DEFAULT = 6; // mirrors src/components/product/StockStatus.tsx

const productsById = new Map<string, Product>(productsSeed.map((p) => [p.id, structuredClone(p)]));

function generateId(): string {
  return `prod-admin-${crypto.randomUUID().slice(0, 8)}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isSlugTaken(slug: string, excludeId?: string): boolean {
  for (const p of productsById.values()) {
    if (p.slug === slug && p.id !== excludeId) return true;
  }
  return false;
}

function uniqueSlug(base: string, excludeId?: string): string {
  let slug = base || "product";
  let n = 2;
  while (isSlugTaken(slug, excludeId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

/**
 * Computes the effective `price`/`compareAtPrice` for "now" from a
 * product's authored regular/sale/schedule fields. A product not using
 * scheduling (no `regularPrice` set) passes through unchanged — its
 * `price`/`compareAtPrice` are authored directly, as before this feature
 * existed. Applied on every read so a sale activates/deactivates exactly
 * at its scheduled boundary without needing an admin edit to trigger it.
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

function readAll(): Product[] {
  return [...productsById.values()].map((p) => applyScheduledPricing(p));
}

// ---------------------------------------------------------------------------
// Storefront-facing reads — identical names/signatures to the pre-admin
// src/data/products.ts, re-exported from there unchanged.
// ---------------------------------------------------------------------------

export function getProducts(): Product[] {
  return readAll();
}

/**
 * Every listable product — not discontinued, not a draft. `getProductBySlug`
 * still resolves discontinued/draft products directly (an old shared link,
 * or an admin previewing before publishing) so their PDP can show the
 * right notice instead of a 404.
 */
export function getActiveProducts(): Product[] {
  return readAll().filter((p) => !p.discontinued && p.publishStatus !== "draft");
}

export function getProductBySlug(slug: string): Product | undefined {
  const found = [...productsById.values()].find((p) => p.slug === slug);
  return found ? applyScheduledPricing(found) : undefined;
}

export function getProductBySku(sku: string): Product | undefined {
  const found = [...productsById.values()].find((p) => p.sku.toLowerCase() === sku.toLowerCase());
  return found ? applyScheduledPricing(found) : undefined;
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return getActiveProducts().filter((p) => p.categorySlug === categorySlug);
}

export function getProductsByCollection(collectionSlug: string): Product[] {
  return getActiveProducts().filter((p) => p.collectionSlugs.includes(collectionSlug));
}

export function getBestsellers(): Product[] {
  return getActiveProducts().filter((p) => p.badges?.includes("Bestseller"));
}

export function getNewArrivals(): Product[] {
  return getActiveProducts().filter((p) => p.badges?.includes("New"));
}

export function getRelatedProducts(product: Product, limit = 4): Product[] {
  return getActiveProducts()
    .filter((p) => p.id !== product.id && (p.categorySlug === product.categorySlug || p.productType === product.productType))
    .slice(0, limit);
}

/**
 * Resolves `Product.pairsWithSlugs` to full product records; when a product
 * hasn't been curated with explicit pairings, falls back to active products
 * that share a collection but sit in a different category.
 */
export function getPairedProducts(product: Product, limit = 3): Product[] {
  if (product.pairsWithSlugs?.length) {
    return product.pairsWithSlugs
      .map((slug) => getProductBySlug(slug))
      .filter((p): p is Product => p != null && !p.discontinued)
      .slice(0, limit);
  }

  return getActiveProducts()
    .filter(
      (p) =>
        p.id !== product.id &&
        p.categorySlug !== product.categorySlug &&
        p.collectionSlugs.some((slug) => product.collectionSlugs.includes(slug)),
    )
    .slice(0, limit);
}

/** Cart-aware cross-sell: pools getPairedProducts() across every product already in the cart, excludes anything already in the cart, and dedupes. */
export function getComplementaryProducts(cartProductSlugs: string[], limit = 4): Product[] {
  const excluded = new Set(cartProductSlugs);
  const seen = new Set<string>();
  const suggestions: Product[] = [];

  for (const slug of cartProductSlugs) {
    const product = getProductBySlug(slug);
    if (!product) continue;
    for (const candidate of getPairedProducts(product, limit)) {
      if (excluded.has(candidate.slug) || seen.has(candidate.slug)) continue;
      seen.add(candidate.slug);
      suggestions.push(candidate);
      if (suggestions.length >= limit) return suggestions;
    }
  }

  return suggestions;
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

export function listAdminProducts(filters?: AdminProductFilters): Product[] {
  let list = readAll();

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

export function getAdminProductById(id: string): Product | undefined {
  const found = productsById.get(id);
  return found ? applyScheduledPricing(found) : undefined;
}

export type CreateProductInput = Omit<Product, "id" | "slug" | "inStock"> & { slug?: string };

export function createProduct(input: CreateProductInput): Product {
  const id = generateId();
  const slug = uniqueSlug(slugify(input.slug || input.name));
  const product: Product = {
    ...input,
    id,
    slug,
    inStock: input.stockQuantity > 0,
    publishStatus: input.publishStatus ?? "draft",
  };
  productsById.set(id, product);
  return applyScheduledPricing(product);
}

export type UpdateProductInput = Partial<Omit<Product, "id">>;

export function updateProduct(id: string, patch: UpdateProductInput): Product | undefined {
  const existing = productsById.get(id);
  if (!existing) return undefined;

  const slug = patch.slug && patch.slug !== existing.slug ? uniqueSlug(slugify(patch.slug), id) : existing.slug;
  const stockQuantity = patch.stockQuantity ?? existing.stockQuantity;

  const updated: Product = {
    ...existing,
    ...patch,
    id,
    slug,
    inStock: stockQuantity > 0,
  };
  productsById.set(id, updated);
  return applyScheduledPricing(updated);
}

/** "Archive" reuses the existing `discontinued` flag — retired, hidden from listings, PDP still reachable directly. There's no separate archive status; this is the same lifecycle state the pre-admin catalog already had a field for. */
export function archiveProduct(id: string): Product | undefined {
  return updateProduct(id, { discontinued: true });
}

export function restoreProduct(id: string): Product | undefined {
  return updateProduct(id, { discontinued: false });
}

export function duplicateProduct(id: string): Product | undefined {
  const existing = productsById.get(id);
  if (!existing) return undefined;

  const newId = generateId();
  const slug = uniqueSlug(`${existing.slug}-copy`);
  const duplicate: Product = {
    ...structuredClone(existing),
    id: newId,
    slug,
    name: `${existing.name} (Copy)`,
    sku: `${existing.sku}-COPY`,
    publishStatus: "draft",
  };
  productsById.set(newId, duplicate);
  return duplicate;
}

/**
 * Removes the product record with no cross-store checks — this module's
 * read functions (getActiveProducts, getProductBySlug, ...) are used from
 * client components via src/data/products.ts, so it must never import
 * orders/store.ts itself (that module depends on the DB-backed,
 * server-only settings store, which cannot be reachable from a client
 * bundle). The "refuse to delete a product referenced by a past order"
 * safety check lives in src/lib/admin/products-delete.ts instead, which
 * calls this and is only ever imported from the admin DELETE route.
 */
export function removeProductRecord(id: string): void {
  productsById.delete(id);
}
