export interface CuratedCollection {
  /** Also doubles as the /collections/[id] route slug and the value stored in Product.collectionSlugs. */
  id: string;
  name: string;
  description: string;
  image: string;
  href: string;
}
