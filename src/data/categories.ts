/**
 * Thin re-export of the storefront-facing category reads — the actual data
 * now lives in the mutable categories store (src/lib/admin/categories-store.ts),
 * seeded once from src/data/categories-seed.ts. `categories` was a plain
 * array before this file existed — it's a `getCategories()` function now,
 * since a plain array binding can't stay live once the underlying data can
 * change at runtime; see the README's admin section.
 */
export { getCategories, getCategoryBySlug } from "@/lib/admin/categories-store";
