import type { CatalogueFacets, CatalogueFilters } from "@/lib/catalogue";
import { FilterPanel } from "@/components/catalogue/FilterPanel";

/** Desktop-only filter surface: an always-visible sidebar of expandable sections, applying changes immediately. */
export function FilterSidebar({
  filters,
  onChange,
  facets,
  lockedCategory,
  lockedCollection,
}: {
  filters: CatalogueFilters;
  onChange: (updater: (prev: CatalogueFilters) => CatalogueFilters) => void;
  facets: CatalogueFacets;
  lockedCategory?: string;
  lockedCollection?: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="sticky top-28">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone">Filter</p>
        <FilterPanel
          filters={filters}
          onChange={onChange}
          facets={facets}
          lockedCategory={lockedCategory}
          lockedCollection={lockedCollection}
        />
      </div>
    </aside>
  );
}
