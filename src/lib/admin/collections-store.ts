import type { CuratedCollection } from "@/types/collection";
import { collectionsSeed } from "@/data/collections-seed";
import { getActiveProducts } from "@/lib/admin/products-store";

/**
 * In-memory curated-collections store — same rationale/pattern as
 * products-store.ts and categories-store.ts. src/data/collections.ts
 * re-exports the storefront-facing functions below unchanged. Assigning a
 * product to a collection stays a product-side edit (Product.collectionSlugs,
 * managed from the product form) — this store owns the collection's own
 * name/description/image, not its membership list.
 */

const collectionsById = new Map<string, CuratedCollection>(collectionsSeed.map((c) => [c.id, structuredClone(c)]));

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isSlugTaken(id: string, excludeId?: string): boolean {
  for (const c of collectionsById.values()) {
    if (c.id === id && c.id !== excludeId) return true;
  }
  return false;
}

function uniqueId(base: string, excludeId?: string): string {
  let id = base || "collection";
  let n = 2;
  while (isSlugTaken(id, excludeId)) {
    id = `${base}-${n}`;
    n += 1;
  }
  return id;
}

function readAll(): CuratedCollection[] {
  return [...collectionsById.values()];
}

// ---------------------------------------------------------------------------
// Storefront-facing reads — identical names/signatures to the pre-admin
// src/data/collections.ts, re-exported from there unchanged.
// ---------------------------------------------------------------------------

export function getCuratedCollections(): CuratedCollection[] {
  return readAll();
}

export function getCollectionBySlug(slug: string): CuratedCollection | undefined {
  return collectionsById.get(slug);
}

export function getCollectionProductCount(slug: string): number {
  return getActiveProducts().filter((product) => product.collectionSlugs.includes(slug)).length;
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/collections and /api/admin/collections/**.
// ---------------------------------------------------------------------------

export function listAdminCollections(): CuratedCollection[] {
  return readAll();
}

export function getAdminCollectionById(id: string): CuratedCollection | undefined {
  return collectionsById.get(id);
}

export type CreateCollectionInput = {
  name: string;
  description: string;
  image: string;
  /** Optional explicit id/slug — defaults to a slugified name. Also becomes the /collections/[id] route and href. */
  id?: string;
};

export function createCollection(input: CreateCollectionInput): CuratedCollection {
  const id = uniqueId(slugify(input.id || input.name));
  const collection: CuratedCollection = {
    id,
    name: input.name,
    description: input.description,
    image: input.image,
    href: `/collections/${id}`,
  };
  collectionsById.set(id, collection);
  return collection;
}

export type UpdateCollectionInput = Partial<Omit<CuratedCollection, "id" | "href">>;

export function updateCollection(id: string, patch: UpdateCollectionInput): CuratedCollection | undefined {
  const existing = collectionsById.get(id);
  if (!existing) return undefined;

  const updated: CuratedCollection = { ...existing, ...patch };
  collectionsById.set(id, updated);
  return updated;
}

export function deleteCollection(id: string): boolean {
  return collectionsById.delete(id);
}
