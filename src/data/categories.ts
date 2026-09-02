import type { Category } from "@/types/category";
import { products } from "@/data/products";

/**
 * Temporary seed data. Once Supabase is connected, categories should be
 * fetched from the `categories` table instead — see src/lib/supabase.
 */
const baseCategories: Omit<Category, "itemCount">[] = [
  {
    id: "cat-glassware",
    slug: "glassware",
    name: "Glassware",
    description: "Coupes, tumblers and stemware, mouth-blown for everyday elegance.",
    image: "/images/categories/glassware.svg",
  },
  {
    id: "cat-barware",
    slug: "barware",
    name: "Barware",
    description: "Shakers, jiggers and bar tools built for the home mixologist.",
    image: "/images/categories/barware.svg",
  },
  {
    id: "cat-tableware",
    slug: "tableware",
    name: "Tableware",
    description: "Plates, bowls and linens for a table set with intention.",
    image: "/images/categories/tableware.svg",
  },
  {
    id: "cat-serveware",
    slug: "serveware",
    name: "Serveware",
    description: "Decanters, trays and ice buckets that carry the evening.",
    image: "/images/categories/serveware.svg",
  },
  {
    id: "cat-gift-sets",
    slug: "gift-sets",
    name: "Gift Sets",
    description: "Curated pairings, boxed and ribboned, ready to give.",
    image: "/images/categories/gift-sets.svg",
  },
  {
    id: "cat-accessories",
    slug: "accessories",
    name: "Accessories",
    description: "Candles, coasters and small objects that finish a room.",
    image: "/images/categories/accessories.svg",
  },
];

/** itemCount is derived from the live product list so it can never drift out of sync. */
export const categories: Category[] = baseCategories.map((category) => ({
  ...category,
  itemCount: products.filter((product) => product.categorySlug === category.slug).length,
}));

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}
