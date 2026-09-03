import type { Category } from "@/types/category";
import { categoriesSeed } from "@/data/categories-seed";
import { getActiveProducts, getProducts } from "@/lib/admin/products-store";

/**
 * In-memory categories store — same rationale/pattern as products-store.ts.
 * src/data/categories.ts re-exports the storefront-facing functions below
 * unchanged, so every existing call site reflects whatever the admin
 * dashboard last wrote (see the README's admin section).
 */

const categoriesById = new Map<string, Omit<Category, "itemCount">>(
  categoriesSeed.map((c) => [c.id, structuredClone(c)]),
);

function generateId(): string {
  return `cat-admin-${crypto.randomUUID().slice(0, 8)}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function isSlugTaken(slug: string, excludeId?: string): boolean {
  for (const c of categoriesById.values()) {
    if (c.slug === slug && c.id !== excludeId) return true;
  }
  return false;
}

function uniqueSlug(base: string, excludeId?: string): string {
  let slug = base || "category";
  let n = 2;
  while (isSlugTaken(slug, excludeId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

function withItemCount(category: Omit<Category, "itemCount">): Category {
  return {
    ...category,
    itemCount: getActiveProducts().filter((p) => p.categorySlug === category.slug).length,
  };
}

function readAll(): Category[] {
  return [...categoriesById.values()].sort((a, b) => a.sortOrder - b.sortOrder).map(withItemCount);
}

// ---------------------------------------------------------------------------
// Storefront-facing reads — identical names/signatures to the pre-admin
// src/data/categories.ts, re-exported from there unchanged.
// ---------------------------------------------------------------------------

/** All categories, in their admin-set display order — itemCount is derived from the live, active product list so it can never drift out of sync. */
export function getCategories(): Category[] {
  return readAll();
}

export function getCategoryBySlug(slug: string): Category | undefined {
  const found = [...categoriesById.values()].find((c) => c.slug === slug);
  return found ? withItemCount(found) : undefined;
}

// ---------------------------------------------------------------------------
// Admin-facing reads/writes — /admin/categories and /api/admin/categories/**.
// ---------------------------------------------------------------------------

export function listAdminCategories(): Category[] {
  return readAll();
}

export function getAdminCategoryById(id: string): Category | undefined {
  const found = categoriesById.get(id);
  return found ? withItemCount(found) : undefined;
}

export type CreateCategoryInput = {
  name: string;
  description: string;
  image: string;
  slug?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export function createCategory(input: CreateCategoryInput): Category {
  const id = generateId();
  const slug = uniqueSlug(slugify(input.slug || input.name));
  const sortOrder = categoriesById.size > 0 ? Math.max(...[...categoriesById.values()].map((c) => c.sortOrder)) + 1 : 0;
  const category: Omit<Category, "itemCount"> = {
    id,
    slug,
    name: input.name,
    description: input.description,
    image: input.image,
    seoTitle: input.seoTitle,
    seoDescription: input.seoDescription,
    sortOrder,
  };
  categoriesById.set(id, category);
  return withItemCount(category);
}

export type UpdateCategoryInput = Partial<Omit<CreateCategoryInput, "slug">> & { slug?: string };

export function updateCategory(id: string, patch: UpdateCategoryInput): Category | undefined {
  const existing = categoriesById.get(id);
  if (!existing) return undefined;

  const slug = patch.slug && patch.slug !== existing.slug ? uniqueSlug(slugify(patch.slug), id) : existing.slug;
  const updated: Omit<Category, "itemCount"> = { ...existing, ...patch, id, slug };
  categoriesById.set(id, updated);
  return withItemCount(updated);
}

export type DeleteCategoryResult = { ok: true } | { ok: false; reason: string };

/** Refuses to delete a category still assigned to any product — reassign or archive those products first. */
export function deleteCategory(id: string): DeleteCategoryResult {
  const existing = categoriesById.get(id);
  if (!existing) return { ok: false, reason: "Category not found." };

  const referenced = getProducts().some((p) => p.categorySlug === existing.slug);
  if (referenced) {
    return { ok: false, reason: "This category has products assigned to it and can't be deleted — reassign them first." };
  }
  categoriesById.delete(id);
  return { ok: true };
}

/** Reassigns sortOrder sequentially from an admin-supplied display order (drag-and-drop reorder). */
export function reorderCategories(orderedIds: string[]): Category[] {
  orderedIds.forEach((id, index) => {
    const existing = categoriesById.get(id);
    if (existing) categoriesById.set(id, { ...existing, sortOrder: index });
  });
  return readAll();
}
