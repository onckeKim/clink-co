import type { Category } from "@/types/category";

/** Seed data for the categories store (src/lib/admin/categories-store.ts) — the original 6 launch categories, in their original display order. */
export const categoriesSeed: Omit<Category, "itemCount">[] = [
  {
    id: "cat-glassware",
    slug: "glassware",
    name: "Glassware",
    description: "Coupes, tumblers and stemware, mouth-blown for everyday elegance.",
    image: "/images/categories/glassware.svg",
    sortOrder: 0,
  },
  {
    id: "cat-barware",
    slug: "barware",
    name: "Barware",
    description: "Shakers, jiggers and bar tools built for the home mixologist.",
    image: "/images/categories/barware.svg",
    sortOrder: 1,
  },
  {
    id: "cat-tableware",
    slug: "tableware",
    name: "Tableware",
    description: "Plates, bowls and linens for a table set with intention.",
    image: "/images/categories/tableware.svg",
    sortOrder: 2,
  },
  {
    id: "cat-serveware",
    slug: "serveware",
    name: "Serveware",
    description: "Decanters, trays and ice buckets that carry the evening.",
    image: "/images/categories/serveware.svg",
    sortOrder: 3,
  },
  {
    id: "cat-gift-sets",
    slug: "gift-sets",
    name: "Gift Sets",
    description: "Curated pairings, boxed and ribboned, ready to give.",
    image: "/images/categories/gift-sets.svg",
    sortOrder: 4,
  },
  {
    id: "cat-accessories",
    slug: "accessories",
    name: "Accessories",
    description: "Candles, coasters and small objects that finish a room.",
    image: "/images/categories/accessories.svg",
    sortOrder: 5,
  },
];
