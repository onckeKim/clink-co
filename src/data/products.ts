/**
 * Thin re-export of the storefront-facing product reads — the actual data
 * now lives in the mutable products store (src/lib/admin/products-store.ts),
 * seeded once from src/data/products-seed.ts. Every function here has the
 * exact same name and signature it always did, so no call site across the
 * storefront needed to change; they now transparently reflect whatever the
 * admin dashboard last wrote. `products`/`activeProducts` were plain arrays
 * before this file existed — they're `getProducts()`/`getActiveProducts()`
 * functions now, since a plain array binding can't stay live once the
 * underlying data can change at runtime; see the README's admin section.
 */
export {
  getProducts,
  getActiveProducts,
  getProductBySlug,
  getProductBySku,
  getProductsByCategory,
  getProductsByCollection,
  getBestsellers,
  getNewArrivals,
  getRelatedProducts,
  getPairedProducts,
  getComplementaryProducts,
} from "@/lib/admin/products-store";
