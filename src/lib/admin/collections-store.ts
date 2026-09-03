import "server-only";
import type { CuratedCollection } from "@/types/collection";
import { getActiveProducts } from "@/lib/admin/products-store";
import * as db from "@/lib/db/collections";
import type { CollectionWithHref } from "@/lib/db/collections";

/**
 * Async wrapper over src/lib/db/collections.ts (the real `collections`
 * table). `id` maps from the DB row's `slug` column, not its internal
 * uuid `id` — CuratedCollection.id (src/types/collection.ts) has always
 * doubled as the /collections/[id] route slug and the value stored in
 * Product.collectionSlugs, and is immutable after creation, so every
 * admin operation here keys off it the same way storefront reads do.
 */

function fromRow(row: CollectionWithHref): CuratedCollection {
  return {
    id: row.slug,
    name: row.name,
    description: row.description ?? "",
    image: row.image ?? "",
    href: row.href,
  };
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Storefront-facing reads — identical names/signatures to the pre-admin
// src/data/collections.ts, re-exported from there unchanged.
// ---------------------------------------------------------------------------

export async function getCuratedCollections(): Promise<CuratedCollection[]> {
  const rows = await db.getCollections();
  return rows.map(fromRow);
}

export async function getCollectionBySlug(slug: string): Promise<CuratedCollection | undefined> {
  const row = await db.getCollectionBySlug(slug);
  return row ? fromRow(row) : undefined;
}

export async function getCollectionProductCount(slug: string): Promise<number> {
  return getActiveProducts().filter((product) => product.collectionSlugs.includes(slug)).length;
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/collections and /api/admin/collections/**.
// ---------------------------------------------------------------------------

export async function listAdminCollections(): Promise<CuratedCollection[]> {
  const rows = await db.listAllCollections();
  return rows.map(fromRow);
}

export async function getAdminCollectionById(id: string): Promise<CuratedCollection | undefined> {
  const row = await db.getCollectionById(id);
  return row ? fromRow(row) : undefined;
}

export interface CreateCollectionInput {
  name: string;
  description: string;
  image: string;
  /** Optional explicit id/slug — defaults to a slugified name. Also becomes the /collections/[id] route and href. */
  id?: string;
}

export async function createCollection(input: CreateCollectionInput): Promise<CuratedCollection> {
  const row = await db.createCollection({
    slug: slugify(input.id || input.name),
    name: input.name,
    description: input.description,
    image: input.image,
  });
  return fromRow(row);
}

export type UpdateCollectionInput = Partial<Omit<CuratedCollection, "id" | "href">>;

export async function updateCollection(id: string, patch: UpdateCollectionInput): Promise<CuratedCollection> {
  const row = await db.updateCollection(id, {
    name: patch.name,
    description: patch.description,
    image: patch.image,
  });
  return fromRow(row);
}

export async function deleteCollection(id: string): Promise<void> {
  await db.deleteCollection(id);
}
