import type { Category } from "@/types/category";

/**
 * Temporary seed data. Once Supabase is connected, categories should be
 * fetched from the `categories` table instead — see src/lib/supabase.
 */
export const categories: Category[] = [
  {
    id: "cat-glassware",
    slug: "glassware",
    name: "Glassware",
    description: "Coupes, tumblers and stemware, mouth-blown for everyday elegance.",
    image: "/images/categories/glassware.svg",
    itemCount: 24,
  },
  {
    id: "cat-barware",
    slug: "barware",
    name: "Barware",
    description: "Shakers, jiggers and bar tools built for the home mixologist.",
    image: "/images/categories/barware.svg",
    itemCount: 18,
  },
  {
    id: "cat-tableware",
    slug: "tableware",
    name: "Tableware",
    description: "Plates, bowls and linens for a table set with intention.",
    image: "/images/categories/tableware.svg",
    itemCount: 21,
  },
  {
    id: "cat-serveware",
    slug: "serveware",
    name: "Serveware",
    description: "Decanters, trays and ice buckets that carry the evening.",
    image: "/images/categories/serveware.svg",
    itemCount: 15,
  },
  {
    id: "cat-gift-sets",
    slug: "gift-sets",
    name: "Gift Sets",
    description: "Curated pairings, boxed and ribboned, ready to give.",
    image: "/images/categories/gift-sets.svg",
    itemCount: 12,
  },
  {
    id: "cat-accessories",
    slug: "accessories",
    name: "Accessories",
    description: "Candles, coasters and small objects that finish a room.",
    image: "/images/categories/accessories.svg",
    itemCount: 16,
  },
];
