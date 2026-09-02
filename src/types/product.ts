export type ProductBadge = "New" | "Bestseller" | "Limited" | "Gift Edit";

export interface ProductVariant {
  id: string;
  /** Shown as a colour/style option chip, e.g. "Smoke", "Ivory". */
  label: string;
  /** Additional cost relative to the base price, in the site currency (ZAR). */
  priceDelta?: number;
  /** CSS colour value used to render the swatch dot for this option. */
  swatch?: string;
  /** Product image(s) to show in the gallery when this variant is selected — falls back to `Product.images` when absent. */
  images?: string[];
}

/** A simple labelled choice with optional pricing — used for the set-size selector. */
export interface ProductOption {
  id: string;
  label: string;
  priceDelta?: number;
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
  /** Alternate set sizes this product can be purchased in, e.g. Set of 4 / Set of 6 — rendered as a selector on the PDP. Distinct from `setSize`, which is just the display spec for products with only one size. */
  setSizeOptions?: ProductOption[];
  /** Source of truth for stock — `inStock` should always equal `stockQuantity > 0`. */
  stockQuantity: number;
  inStock: boolean;
  /** True once a product is retired and will not restock — distinct from a temporary out-of-stock. Excluded from shop/collection listings and search via `activeProducts`, but its own PDP stays reachable. */
  discontinued?: boolean;
  /** Surfaced via the "Featured" sort and potential homepage curation. */
  featured: boolean;
  badges?: ProductBadge[];
  /** Colour/style options — rendered as swatch chips on product cards and the PDP variant selector. */
  variants?: ProductVariant[];
  /** A short looping product video, shown as an extra slide in the PDP gallery. */
  videoUrl?: string;
  rating?: number;
  reviewCount?: number;
  /** Free-form tags — searchable, not currently a filter facet. */
  tags: string[];
  careInstructions: string[];
  dimensions?: ProductDimensions;
  weightGrams?: number;
  /** Short, benefit-led bullets for the PDP's "Key benefits" section. */
  keyBenefits?: string[];
  /** Lifestyle/editorial image for the PDP's lifestyle section — falls back to the category's image when absent. */
  lifestyleImage?: string;
  lifestyleCaption?: string;
  /** Curated cross-sell slugs for "Pairs well with" — falls back to a same-collection, different-category pick when absent. */
  pairsWithSlugs?: string[];
  /** Packaging/gifting copy for the PDP's "Packaging information" accordion — falls back to generic copy when absent. */
  packagingInfo?: string;
}
