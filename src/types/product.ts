export type ProductBadge = "New" | "Bestseller" | "Limited" | "Gift Edit";

export interface ProductVariant {
  id: string;
  /** Shown as a colour/style option chip, e.g. "Smoke", "Ivory". */
  label: string;
  /** Additional cost relative to the base price, in the site currency (ZAR). */
  priceDelta?: number;
  /** CSS colour value used to render the swatch dot for this option. */
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
  currency: "ZAR";
  images: string[];
  categorySlug: string;
  material?: string;
  capacity?: string;
  setSize?: string;
  inStock: boolean;
  badges?: ProductBadge[];
  /** Colour/style options — rendered as swatch chips on product cards. */
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
}
