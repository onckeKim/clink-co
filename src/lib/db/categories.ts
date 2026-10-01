import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database } from "@/lib/supabase/types";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

export interface CategoryWithCount extends CategoryRow {
  /** Live count of published products carrying this as their primary category — never stored, so it can't drift (see the comment on categories.item_count in supabase/migrations/20250101000200_catalog.sql). */
  item_count: number;
}

/** Published categories, in admin-configured display order, each with a live product count. */
export async function getCategories(): Promise<CategoryWithCount[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("categories")
    .select("*, product_categories!inner(count)")
    .eq("is_published", true)
    .is("deleted_at", null)
    .order("sort_order", { ascending: true });
  const rows = unwrap({ data, error }) as unknown as Array<CategoryRow & { product_categories: { count: number }[] }>;
  return rows.map((row) => ({ ...row, item_count: row.product_categories[0]?.count ?? 0 }));
}

export async function getCategoryBySlug(slug: string): Promise<CategoryRow | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .is("deleted_at", null)
    .maybeSingle();
  return unwrapNullable({ data, error });
}

/** Admin lookup by id — no is_published filter (categories:view is the real gate; the app has no draft-category concept today, but this matches products:view's own "admins see everything" behavior). */
export async function getCategoryById(id: string): Promise<CategoryRow | null> {
  const db = await getDb();
  const { data, error } = await db.from("categories").select("*").eq("id", id).is("deleted_at", null).maybeSingle();
  return unwrapNullable({ data, error });
}

/** Every non-deleted category regardless of publish status — the admin category list. */
export async function listAllCategories(): Promise<CategoryRow[]> {
  const db = await getDb();
  const { data, error } = await db.from("categories").select("*").is("deleted_at", null).order("sort_order", { ascending: true });
  return unwrap({ data, error });
}

type CategoryInsert = Database["public"]["Tables"]["categories"]["Insert"];
type CategoryUpdate = Database["public"]["Tables"]["categories"]["Update"];

export async function createCategory(input: CategoryInsert): Promise<CategoryRow> {
  const db = await getDb();
  const { data, error } = await db.from("categories").insert(input).select().single();
  return unwrap({ data, error });
}

export async function updateCategory(id: string, patch: CategoryUpdate): Promise<CategoryRow> {
  const db = await getDb();
  const { data, error } = await db.from("categories").update(patch).eq("id", id).select().single();
  return unwrap({ data, error });
}

/**
 * Hard delete — categories, unlike products, have no soft-delete concept in
 * the app (an admin either has one or doesn't). The foreign key from
 * product_categories is ON DELETE CASCADE, so this also unassigns every
 * product from the category; the caller (the admin API route) should
 * check first and refuse when the category still has products, matching
 * the in-memory store's existing "refuses if any product references the
 * category" behavior.
 */
export async function deleteCategory(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("categories").delete().eq("id", id);
  if (error) throw mapPostgrestError(error);
}

/** Reassigns sort_order sequentially from an admin-supplied display order (drag-and-drop reorder) — one update per row, since Postgres has no bulk "set column from an array of (id, value) pairs" through PostgREST. */
export async function reorderCategories(orderedIds: string[]): Promise<CategoryRow[]> {
  const db = await getDb();
  const results = await Promise.all(
    orderedIds.map((id, index) => db.from("categories").update({ sort_order: index }).eq("id", id)),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw mapPostgrestError(failed.error);
  return listAllCategories();
}
