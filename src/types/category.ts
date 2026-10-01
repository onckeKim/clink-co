export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  itemCount: number;
  /** Admin-controlled display order — ascending, lower shows first. */
  sortOrder: number;
  seoTitle?: string;
  seoDescription?: string;
}
