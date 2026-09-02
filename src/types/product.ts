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

/** All measurements in centimetres, for the packed/assembled item. */
export interface ProductDimensions {
  heightCm: number;
  widthCm: number;
  depthCm: number;
}

export interface Product {
  id: string;
  slug: string;
  /** Stock-keeping unit, e.g. "CC-GLS-SOL-04". Searchable. */
  sku: string;
  name: string;
  /** One line shown on cards, under the product name. */
  shortDescription: string;
  /** Full copy shown on the product detail page. */
  description: string;
  /** Current selling price. */
  price: number;
  /** Original price, shown struck through, when the product is on sale. */
  compareAtPrice?: number;
  currency: "ZAR";
  images: string[];
  /** One of the 6 top-level shop categories — see src/data/categories.ts. */
  categorySlug: string;
  /** Finer-grained facet within a category, e.g. "Wine Glasses", "Decanters". */
  productType: string;
  /** Curated collections this product belongs to (0+) — see src/data/collections.ts. */
  collectionSlugs: string[];
  material?: string;
  /**
   * Simple colour names for filtering, e.g. ["Ivory", "Sage"]. Independent
   * of `variants` (which drives the swatch UI + optional per-option
   * pricing) so products without a full variant picker can still be
   * filtered by colour — use `getProductColors()` to read the merged set.
   */
  colors?: string[];
  capacity?: string;
  setSize?: string;
  /** Source of truth for stock — `inStock` should always equal `stockQuantity > 0`. */
  stockQuantity: number;
  inStock: boolean;
  /** Surfaced via the "Featured" sort and potential homepage curation. */
  featured: boolean;
  badges?: ProductBadge[];
  /** Colour/style options — rendered as swatch chips on product cards. */
  variants?: ProductVariant[];
  rating?: number;
  reviewCount?: number;
  /** Free-form tags — searchable, not currently a filter facet. */
  tags: string[];
  careInstructions: string[];
  dimensions?: ProductDimensions;
  weightGrams?: number;
}
