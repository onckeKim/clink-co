/**
 * Thin re-export of the storefront-facing product reads — the actual data
 * lives in the `products` table (src/lib/admin/products-store.ts,
 * src/lib/db/products.ts). Server-only (products-store.ts pulls in
 * server-only DB access) — a client component reads the same data via
 * useCatalog().products instead (see src/components/providers/
 * CatalogProvider.tsx), since it can't call an async DB read mid-render.
 * getRelatedProducts()/getPairedProducts()/getComplementaryProducts() moved
 * to lib/catalogue.ts — they're pure list transforms, not reads, so they
 * work identically from either side.
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
} from "@/lib/admin/products-store";
