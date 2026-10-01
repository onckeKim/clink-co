/**
 * Thin re-export of the storefront-facing hero slide reads — the actual
 * data now lives in the mutable content store
 * (src/lib/admin/content-store.ts), seeded once from src/data/content-seed.ts.
 */
export { getHeroSlides } from "@/lib/admin/content-store";
export type { HeroSlide } from "@/types/content";
