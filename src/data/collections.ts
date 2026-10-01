/**
 * Thin re-export of the storefront-facing collection reads — the actual
 * data now lives in the mutable collections store
 * (src/lib/admin/collections-store.ts), seeded once from
 * src/data/collections-seed.ts. `curatedCollections` was a plain array
 * before this file existed — it's a `getCuratedCollections()` function now,
 * for the same reason `products`/`categories` became functions; see the
 * README's admin section.
 */
export {
  getCuratedCollections,
  getCollectionBySlug,
  getCollectionProductCount,
} from "@/lib/admin/collections-store";
export type { CuratedCollection } from "@/types/collection";
