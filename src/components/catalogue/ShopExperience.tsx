"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import type { Product } from "@/types/product";
import {
  applyCatalogue,
  DEFAULT_FILTERS,
  filtersToSearchParams,
  getActiveFilterCount,
  getFacetValues,
  parseFiltersFromSearchParams,
  parsePageFromSearchParams,
  parseSortFromSearchParams,
  PRODUCTS_PER_PAGE,
  type CatalogueFilters,
  type SortKey,
} from "@/lib/catalogue";
import { Breadcrumbs, type BreadcrumbItem } from "@/components/catalogue/Breadcrumbs";
import { FilterSidebar } from "@/components/catalogue/FilterSidebar";
import { FilterDrawer } from "@/components/catalogue/FilterDrawer";
import { ActiveFilterChips } from "@/components/catalogue/ActiveFilterChips";
import { SortSelect } from "@/components/catalogue/SortSelect";
import { ProductGrid } from "@/components/catalogue/ProductGrid";
import { EmptyState } from "@/components/catalogue/EmptyState";
import { ErrorState } from "@/components/catalogue/ErrorState";
import { LoadMoreButton } from "@/components/catalogue/LoadMoreButton";
import { QuickView } from "@/components/product/QuickView";

/**
 * The shared shop experience — reused, with a "locked" facet, across
 * `/shop`, `/shop/[category]` and `/collections/[collection]`. Filter,
 * sort and load-more state all live in the URL (via src/lib/catalogue.ts),
 * so any combination of them is a shareable link; this component's own
 * state is limited to UI-only concerns (drawer open, quick view, the
 * simulated load-more delay).
 */
export function ShopExperience({
  products,
  title,
  description,
  breadcrumbs,
  lockedCategory,
  lockedCollection,
}: {
  /** Already scoped to the current route — e.g. pre-filtered to one category on /shop/[category]. */
  products: Product[];
  title: string;
  description?: string;
  breadcrumbs: BreadcrumbItem[];
  /** Hides the Category filter section — its value is fixed by the route, not user-selectable. */
  lockedCategory?: string;
  /** Hides the Collection filter section — its value is fixed by the route, not user-selectable. */
  lockedCollection?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = React.useMemo(() => parseFiltersFromSearchParams(searchParams), [searchParams]);
  const sort = React.useMemo(() => parseSortFromSearchParams(searchParams), [searchParams]);
  const urlPage = React.useMemo(() => parsePageFromSearchParams(searchParams), [searchParams]);

  const [filterDrawerOpen, setFilterDrawerOpen] = React.useState(false);
  const [quickViewProduct, setQuickViewProduct] = React.useState<Product | null>(null);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [loadedPages, setLoadedPages] = React.useState(urlPage);
  const loadMoreTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep the "loaded so far" count anchored to the URL's page param —
  // adjusted during render (not an effect) so a filter/sort change or a
  // shared URL's page value takes effect without an extra render pass.
  const [prevUrlPage, setPrevUrlPage] = React.useState(urlPage);
  if (urlPage !== prevUrlPage) {
    setPrevUrlPage(urlPage);
    setLoadedPages(urlPage);
  }

  React.useEffect(
    () => () => {
      if (loadMoreTimeout.current) clearTimeout(loadMoreTimeout.current);
    },
    [],
  );

  const updateUrl = React.useCallback(
    (nextFilters: CatalogueFilters, nextSort: SortKey, nextPage: number) => {
      const query = filtersToSearchParams(nextFilters, nextSort, nextPage).toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  const applyFilters = React.useCallback(
    (updater: (prev: CatalogueFilters) => CatalogueFilters) => {
      updateUrl(updater(filters), sort, 1);
    },
    [filters, sort, updateUrl],
  );

  const handleClearFilters = () => updateUrl(DEFAULT_FILTERS, sort, 1);

  const facets = React.useMemo(() => getFacetValues(products), [products]);

  const { results, catalogueError } = React.useMemo(() => {
    try {
      return { results: applyCatalogue(products, filters, sort), catalogueError: false };
    } catch {
      return { results: [] as Product[], catalogueError: true };
    }
  }, [products, filters, sort]);

  const shownCount = Math.min(results.length, loadedPages * PRODUCTS_PER_PAGE);
  const pageItems = results.slice(0, shownCount);
  const activeFilterCount = getActiveFilterCount(filters);
  const hasActiveNarrowing = activeFilterCount > 0 || Boolean(filters.search);

  const handleLoadMore = () => {
    setLoadingMore(true);
    if (loadMoreTimeout.current) clearTimeout(loadMoreTimeout.current);
    loadMoreTimeout.current = setTimeout(() => {
      const nextPage = loadedPages + 1;
      setLoadedPages(nextPage);
      updateUrl(filters, sort, nextPage);
      setLoadingMore(false);
    }, 400);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={breadcrumbs} className="mb-6" />

      <div className="mb-8 max-w-2xl">
        <h1 className="font-display text-display-2xl text-charcoal">{title}</h1>
        {description && <p className="mt-3 text-sm leading-relaxed text-stone">{description}</p>}
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <FilterSidebar
          filters={filters}
          onChange={applyFilters}
          facets={facets}
          lockedCategory={lockedCategory}
          lockedCollection={lockedCollection}
        />

        <div className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-stone">
              {results.length} {results.length === 1 ? "product" : "products"}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFilterDrawerOpen(true)}
                className="focus-ring flex h-11 items-center gap-2 rounded-full border border-sand bg-white px-5 text-sm font-medium text-charcoal transition-colors hover:border-charcoal/40 lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
              </button>
              <SortSelect value={sort} onChange={(nextSort) => updateUrl(filters, nextSort, 1)} />
            </div>
          </div>

          {hasActiveNarrowing && (
            <div className="mb-6">
              <ActiveFilterChips
                filters={filters}
                onChange={applyFilters}
                priceFloor={facets.priceMin}
                priceCeiling={facets.priceMax}
              />
            </div>
          )}

          {catalogueError ? (
            <ErrorState onRetry={() => updateUrl(DEFAULT_FILTERS, "featured", 1)} />
          ) : pageItems.length === 0 ? (
            <EmptyState
              title={filters.search ? `No results for "${filters.search}"` : undefined}
              description={
                filters.search
                  ? "Try a different search term or adjust your filters."
                  : undefined
              }
              onClearFilters={hasActiveNarrowing ? handleClearFilters : undefined}
            />
          ) : (
            <>
              <ProductGrid products={pageItems} onQuickView={setQuickViewProduct} />
              <LoadMoreButton
                onClick={handleLoadMore}
                loading={loadingMore}
                shown={pageItems.length}
                total={results.length}
              />
            </>
          )}
        </div>
      </div>

      <FilterDrawer
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        filters={filters}
        onApply={(next) => updateUrl(next, sort, 1)}
        facets={facets}
        lockedCategory={lockedCategory}
        lockedCollection={lockedCollection}
      />

      <QuickView product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
