export interface CuratedCollection {
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
}

/** The 3 large editorial collection cards on the homepage. */
export const curatedCollections: CuratedCollection[] = [
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
];
