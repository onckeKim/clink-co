import "server-only";
import type { Category } from "@/types/category";
import type { Product } from "@/types/product";
import { getActiveProducts, getProducts } from "@/lib/admin/products-store";
import * as db from "@/lib/db/categories";
import type { Database } from "@/lib/supabase/types";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

/**
 * Async wrapper over src/lib/db/categories.ts (the real `categories`
 * table). itemCount is derived from the live, active product list (passed
 * in rather than fetched per row, so listing N categories costs one
 * getActiveProducts() call, not N) rather than a live DB join — see the
 * Phase 2 write-up.
 */

function fromRow(row: CategoryRow, activeProducts: Product[]): Category {
  const itemCount = activeProducts.filter((p) => p.categorySlug === row.slug).length;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    image: row.image ?? "",
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    sortOrder: row.sort_order,
    itemCount,
  };
}

// ---------------------------------------------------------------------------
// Storefront-facing reads — identical names/signatures to the pre-admin
// src/data/categories.ts, re-exported from there unchanged.
// ---------------------------------------------------------------------------

/** All published categories, in their admin-set display order — itemCount is derived from the live, active product list so it can never drift out of sync. */
export async function getCategories(): Promise<Category[]> {
  const [rows, activeProducts] = await Promise.all([db.listAllCategories(), getActiveProducts()]);
  return rows
    .filter((r) => r.is_published)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => fromRow(row, activeProducts));
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const [row, activeProducts] = await Promise.all([db.getCategoryBySlug(slug), getActiveProducts()]);
  return row ? fromRow(row, activeProducts) : undefined;
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/categories and /api/admin/categories/**.
// ---------------------------------------------------------------------------

export async function listAdminCategories(): Promise<Category[]> {
  const [rows, activeProducts] = await Promise.all([db.listAllCategories(), getActiveProducts()]);
  return rows.map((row) => fromRow(row, activeProducts));
}

export async function getAdminCategoryById(id: string): Promise<Category | undefined> {
  const [row, activeProducts] = await Promise.all([db.getCategoryById(id), getActiveProducts()]);
  return row ? fromRow(row, activeProducts) : undefined;
}

export interface CreateCategoryInput {
  name: string;
  description: string;
  image: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategory(input: CreateCategoryInput): Promise<Category> {
  const existing = await db.listAllCategories();
  const sortOrder = existing.length > 0 ? Math.max(...existing.map((c) => c.sort_order)) + 1 : 0;
  const row = await db.createCategory({
    slug: slugify(input.slug || input.name),
    name: input.name,
    description: input.description,
    image: input.image,
    seo_title: input.seoTitle ?? null,
    seo_description: input.seoDescription ?? null,
    sort_order: sortOrder,
  });
  return fromRow(row, await getActiveProducts());
}

export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, "slug">> & { slug?: string };

export async function updateCategory(id: string, patch: UpdateCategoryInput): Promise<Category> {
  const row = await db.updateCategory(id, {
    name: patch.name,
    description: patch.description,
    image: patch.image,
    slug: patch.slug ? slugify(patch.slug) : undefined,
    seo_title: patch.seoTitle,
    seo_description: patch.seoDescription,
  });
  return fromRow(row, await getActiveProducts());
}

export type DeleteCategoryResult = { ok: true } | { ok: false; reason: string };

/** Refuses to delete a category still assigned to any product — reassign or archive those products first. */
export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  const existing = await db.getCategoryById(id);
  if (!existing) return { ok: false, reason: "Category not found." };

  const referenced = (await getProducts()).some((p) => p.categorySlug === existing.slug);
  if (referenced) {
    return { ok: false, reason: "This category has products assigned to it and can't be deleted — reassign them first." };
  }
  await db.deleteCategory(id);
  return { ok: true };
}

/** Reassigns sortOrder sequentially from an admin-supplied display order (drag-and-drop reorder). */
export async function reorderCategories(orderedIds: string[]): Promise<Category[]> {
  const [rows, activeProducts] = await Promise.all([db.reorderCategories(orderedIds), getActiveProducts()]);
  return rows.map((row) => fromRow(row, activeProducts));
}
