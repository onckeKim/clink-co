import type { CuratedCollection } from "@/types/collection";

/** Seed data for the collections store (src/lib/admin/collections-store.ts). */
export const collectionsSeed: CuratedCollection[] = [
  {
    id: "home-bar-edit",
    name: "The Home Bar Edit",
    description: "Shakers, jiggers and glassware for the ritual of the first pour.",
    image: "/images/collection-home-bar.svg",
    href: "/collections/home-bar-edit",
  },
  {
    id: "everyday-elegance",
    name: "Everyday Elegance",
    description: "Considered pieces sturdy enough for Tuesday, refined enough for Saturday.",
    image: "/images/collection-everyday-elegance.svg",
    href: "/collections/everyday-elegance",
  },
  {
    id: "gifts-worth-giving",
    name: "Gifts Worth Giving",
    description: "Boxed, ribboned sets for the hosts, newlyweds and new-home friends on your list.",
    image: "/images/collection-gifts-worth-giving.svg",
    href: "/collections/gifts-worth-giving",
  },
  {
    id: "autumn-edit",
    name: "The Autumn Edit",
    description: "Seasonal glassware and warm-toned tableware for the months ahead.",
    image: "/images/hero-table.svg",
    href: "/collections/autumn-edit",
  },
];
