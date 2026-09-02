export type ProductBadge = "New" | "Bestseller" | "Limited" | "Gift Edit";

export interface ProductVariant {
  id: string;
  label: string;
  /** Additional cost relative to the base price, in USD. */
  priceDelta?: number;
  swatch?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  /** Short line shown on cards, under the product name. */
  tagline: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  currency: "USD";
  images: string[];
  categorySlug: string;
  material?: string;
  capacity?: string;
  setSize?: string;
  inStock: boolean;
  badges?: ProductBadge[];
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
}
