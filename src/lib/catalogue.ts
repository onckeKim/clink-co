import type { Product } from "@/types/product";
import { products } from "@/data/products";
import { getCategoryBySlug } from "@/data/categories";
import { getCollectionBySlug } from "@/data/collections";

/**
 * Pure catalogue logic: filtering, sorting, search and URL (de)serialization.
 * Kept framework-agnostic (no Next.js imports) so it works identically on
 * the server (initial page render) and the client (interactive updates),
 * and so filter state can round-trip through a shareable URL.
 */

export type SortKey =
  | "featured"
  | "newest"
  | "best-selling"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "discount";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
  { value: "discount", label: "Biggest Discount" },
];

export interface CatalogueFilters {
  categories: string[];
  productTypes: string[];
  collections: string[];
  colors: string[];
  materials: string[];
  capacities: string[];
  setSizes: string[];
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  inStockOnly: boolean;
  isNew: boolean;
  onSale: boolean;
  search: string;
}

export const DEFAULT_FILTERS: CatalogueFilters = {
  categories: [],
  productTypes: [],
  collections: [],
  colors: [],
  materials: [],
  capacities: [],
  setSizes: [],
  priceMin: undefined,
  priceMax: undefined,
  minRating: undefined,
  inStockOnly: false,
  isNew: false,
  onSale: false,
  search: "",
};

export const PRODUCTS_PER_PAGE = 12;

/** Query-param names — the single source of truth for the shop's shareable URL scheme. */
const PARAM = {
  category: "category",
  type: "type",
  collection: "collection",
  color: "color",
  material: "material",
  capacity: "capacity",
  setSize: "set",
  price: "price",
  rating: "rating",
  availability: "availability",
  isNew: "new",
  onSale: "sale",
  sort: "sort",
  search: "q",
  page: "page",
} as const;

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((v) => decodeURIComponent(v.trim()))
    .filter(Boolean);
}

function serializeList(values: string[]): string | null {
  if (!values.length) return null;
  return values.map((v) => encodeURIComponent(v)).join(",");
}

/** The minimal shape the parse* helpers need — satisfied by both `URLSearchParams` and Next.js's read-only search params. */
export interface SearchParamsLike {
  get(name: string): string | null;
}

/** Merges the simple `colors` field with variant labels, so both filtering paths agree on what counts as a colour. */
export function getProductColors(product: Product): string[] {
  const fromColors = product.colors ?? [];
  const fromVariants = product.variants?.map((v) => v.label) ?? [];
  return Array.from(new Set([...fromColors, ...fromVariants]));
}

export function parseFiltersFromSearchParams(searchParams: SearchParamsLike): CatalogueFilters {
  let priceMin: number | undefined;
  let priceMax: number | undefined;
  const priceParam = searchParams.get(PARAM.price);
  if (priceParam) {
    const [minStr, maxStr] = priceParam.split("-");
    if (minStr) {
      const min = Number(minStr);
      if (!Number.isNaN(min)) priceMin = min;
    }
    if (maxStr) {
      const max = Number(maxStr);
      if (!Number.isNaN(max)) priceMax = max;
    }
  }

  const ratingParam = searchParams.get(PARAM.rating);
  const parsedRating = ratingParam ? Number(ratingParam) : undefined;

  return {
    categories: parseList(searchParams.get(PARAM.category)),
    productTypes: parseList(searchParams.get(PARAM.type)),
    collections: parseList(searchParams.get(PARAM.collection)),
    colors: parseList(searchParams.get(PARAM.color)),
    materials: parseList(searchParams.get(PARAM.material)),
    capacities: parseList(searchParams.get(PARAM.capacity)),
    setSizes: parseList(searchParams.get(PARAM.setSize)),
    priceMin,
    priceMax,
    minRating: parsedRating !== undefined && !Number.isNaN(parsedRating) ? parsedRating : undefined,
    inStockOnly: searchParams.get(PARAM.availability) === "in-stock",
    isNew: searchParams.get(PARAM.isNew) === "1",
    onSale: searchParams.get(PARAM.onSale) === "1",
    search: searchParams.get(PARAM.search) ?? "",
  };
}

export function parseSortFromSearchParams(searchParams: SearchParamsLike): SortKey {
  const value = searchParams.get(PARAM.sort);
  return SORT_OPTIONS.find((option) => option.value === value)?.value ?? "featured";
}

export function parsePageFromSearchParams(searchParams: SearchParamsLike): number {
  const value = Number(searchParams.get(PARAM.page));
  return Number.isFinite(value) && value > 1 ? Math.floor(value) : 1;
}

/**
 * Builds the query string for a given filter/sort/page state. Omits any
 * param at its default value, so "clear all" naturally collapses to a bare
 * `/shop` URL rather than `/shop?category=&type=&...`.
 */
export function filtersToSearchParams(filters: CatalogueFilters, sort: SortKey = "featured", page = 1): URLSearchParams {
  const params = new URLSearchParams();
  const setList = (key: string, values: string[]) => {
    const serialized = serializeList(values);
    if (serialized) params.set(key, serialized);
  };

  setList(PARAM.category, filters.categories);
  setList(PARAM.type, filters.productTypes);
  setList(PARAM.collection, filters.collections);
  setList(PARAM.color, filters.colors);
  setList(PARAM.material, filters.materials);
  setList(PARAM.capacity, filters.capacities);
  setList(PARAM.setSize, filters.setSizes);

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    params.set(PARAM.price, `${filters.priceMin ?? ""}-${filters.priceMax ?? ""}`);
  }
  if (filters.minRating !== undefined) params.set(PARAM.rating, String(filters.minRating));
  if (filters.inStockOnly) params.set(PARAM.availability, "in-stock");
  if (filters.isNew) params.set(PARAM.isNew, "1");
  if (filters.onSale) params.set(PARAM.onSale, "1");
  if (filters.search) params.set(PARAM.search, filters.search);
  if (sort !== "featured") params.set(PARAM.sort, sort);
  if (page > 1) params.set(PARAM.page, String(page));

  return params;
}

export function getActiveFilterCount(filters: CatalogueFilters): number {
  return (
    filters.categories.length +
    filters.productTypes.length +
    filters.collections.length +
    filters.colors.length +
    filters.materials.length +
    filters.capacities.length +
    filters.setSizes.length +
    (filters.priceMin !== undefined || filters.priceMax !== undefined ? 1 : 0) +
    (filters.minRating !== undefined ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0) +
    (filters.isNew ? 1 : 0) +
    (filters.onSale ? 1 : 0)
  );
}

export function filterProducts(list: Product[], filters: CatalogueFilters): Product[] {
  return list.filter((product) => {
    if (filters.categories.length && !filters.categories.includes(product.categorySlug)) return false;
    if (filters.productTypes.length && !filters.productTypes.includes(product.productType)) return false;
    if (
      filters.collections.length &&
      !filters.collections.some((slug) => product.collectionSlugs.includes(slug))
    ) {
      return false;
    }
    if (filters.colors.length) {
      const productColors = getProductColors(product);
      if (!filters.colors.some((color) => productColors.includes(color))) return false;
    }
    if (filters.materials.length && (!product.material || !filters.materials.includes(product.material))) {
      return false;
    }
    if (filters.capacities.length && (!product.capacity || !filters.capacities.includes(product.capacity))) {
      return false;
    }
    if (filters.setSizes.length && (!product.setSize || !filters.setSizes.includes(product.setSize))) {
      return false;
    }
    if (filters.priceMin !== undefined && product.price < filters.priceMin) return false;
    if (filters.priceMax !== undefined && product.price > filters.priceMax) return false;
    if (filters.minRating !== undefined && (product.rating ?? 0) < filters.minRating) return false;
    if (filters.inStockOnly && !product.inStock) return false;
    if (filters.isNew && !product.badges?.includes("New")) return false;
    if (filters.onSale && !product.compareAtPrice) return false;
    return true;
  });
}

export function getDiscountPercent(product: Product): number {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return Math.round((1 - product.price / product.compareAtPrice) * 100);
}

export function sortProducts(list: Product[], sort: SortKey): Product[] {
  const sorted = [...list];
  switch (sort) {
    case "newest":
      // Seed data is appended in the order products were introduced, so the
      // tail of the array is the newest — reversing surfaces it first.
      return sorted.reverse();
    case "best-selling":
      return sorted.sort((a, b) => {
        const bestsellerDiff = Number(b.badges?.includes("Bestseller")) - Number(a.badges?.includes("Bestseller"));
        if (bestsellerDiff !== 0) return bestsellerDiff;
        return (b.reviewCount ?? 0) - (a.reviewCount ?? 0);
      });
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort(
        (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.reviewCount ?? 0) - (a.reviewCount ?? 0),
      );
    case "discount":
      return sorted.sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a));
    case "featured":
    default:
      return sorted.sort((a, b) => Number(b.featured) - Number(a.featured) || (b.rating ?? 0) - (a.rating ?? 0));
  }
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const matrix: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));
  for (let i = 0; i < rows; i++) matrix[i][0] = i;
  for (let j = 0; j < cols; j++) matrix[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return matrix[rows - 1][cols - 1];
}

/** Substring match first; falls back to a distance-1 fuzzy match per word so single typos still surface results. */
function fuzzyIncludes(haystack: string, needle: string): boolean {
  const hay = haystack.toLowerCase();
  const query = needle.toLowerCase();
  if (!query) return true;
  if (hay.includes(query)) return true;
  if (query.length < 3) return false;
  return hay.split(/\s+/).some((word) => word.length > 2 && levenshtein(word, query) <= 1);
}

function getSearchHaystacks(product: Product): string[] {
  const categoryName = getCategoryBySlug(product.categorySlug)?.name ?? "";
  const collectionNames = product.collectionSlugs.map((slug) => getCollectionBySlug(slug)?.name ?? "");
  return [
    product.name,
    product.sku,
    product.shortDescription,
    product.description,
    categoryName,
    product.productType,
    ...collectionNames,
    ...product.tags,
  ];
}

/** Matches across name, SKU, description, category, collection and tags — every token in the query must match somewhere. */
export function searchProducts(list: Product[], query: string): Product[] {
  const trimmed = query.trim();
  if (!trimmed) return list;
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  return list.filter((product) => {
    const haystacks = getSearchHaystacks(product);
    return tokens.every((token) => haystacks.some((haystack) => fuzzyIncludes(haystack, token)));
  });
}

export interface HighlightSegment {
  text: string;
  match: boolean;
}

/** Splits `text` around the first case-insensitive occurrence of `query`, for rendering `<mark>`-style highlights. */
export function highlightMatch(text: string, query: string): HighlightSegment[] {
  const trimmed = query.trim();
  if (!trimmed) return [{ text, match: false }];
  const index = text.toLowerCase().indexOf(trimmed.toLowerCase());
  if (index === -1) return [{ text, match: false }];

  const segments: HighlightSegment[] = [];
  if (index > 0) segments.push({ text: text.slice(0, index), match: false });
  segments.push({ text: text.slice(index, index + trimmed.length), match: true });
  if (index + trimmed.length < text.length) {
    segments.push({ text: text.slice(index + trimmed.length), match: false });
  }
  return segments;
}

export interface CatalogueFacets {
  productTypes: string[];
  colors: string[];
  materials: string[];
  capacities: string[];
  setSizes: string[];
  priceMin: number;
  priceMax: number;
}

/** Computes the available option lists for the filter UI from whichever product set it's given (e.g. a single locked category). */
export function getFacetValues(list: Product[] = products): CatalogueFacets {
  const productTypes = new Set<string>();
  const colors = new Set<string>();
  const materials = new Set<string>();
  const capacities = new Set<string>();
  const setSizes = new Set<string>();
  let priceMin = Infinity;
  let priceMax = -Infinity;

  for (const product of list) {
    productTypes.add(product.productType);
    getProductColors(product).forEach((color) => colors.add(color));
    if (product.material) materials.add(product.material);
    if (product.capacity) capacities.add(product.capacity);
    if (product.setSize) setSizes.add(product.setSize);
    priceMin = Math.min(priceMin, product.price);
    priceMax = Math.max(priceMax, product.price);
  }

  return {
    productTypes: Array.from(productTypes).sort(),
    colors: Array.from(colors).sort(),
    materials: Array.from(materials).sort(),
    capacities: Array.from(capacities).sort(),
    setSizes: Array.from(setSizes).sort(),
    priceMin: Number.isFinite(priceMin) ? priceMin : 0,
    priceMax: Number.isFinite(priceMax) ? priceMax : 0,
  };
}

/** The full pipeline — search narrows first, then facet filters, then sort — matching how the UI composes them. */
export function applyCatalogue(list: Product[], filters: CatalogueFilters, sort: SortKey): Product[] {
  const searched = filters.search ? searchProducts(list, filters.search) : list;
  const filtered = filterProducts(searched, filters);
  return sortProducts(filtered, sort);
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  totalPages: number;
  totalItems: number;
}

export function paginate<T>(list: T[], page: number, pageSize: number = PRODUCTS_PER_PAGE): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: list.slice(start, start + pageSize),
    page: safePage,
    totalPages,
    totalItems: list.length,
  };
}
