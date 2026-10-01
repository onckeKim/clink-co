"use client";

import { Star } from "lucide-react";
import type { CatalogueFacets, CatalogueFilters } from "@/lib/catalogue";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { Checkbox } from "@/components/ui/Checkbox";
import { Disclosure } from "@/components/ui/Disclosure";
import { Input } from "@/components/ui/Input";
import { cn, formatPrice } from "@/lib/utils";

type MultiSelectKey =
  | "categories"
  | "productTypes"
  | "collections"
  | "colors"
  | "materials"
  | "capacities"
  | "setSizes";

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function OptionChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "focus-ring rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        active
          ? "border-charcoal bg-charcoal text-warm-white"
          : "border-sand text-charcoal hover:border-charcoal/40",
      )}
    >
      {label}
    </button>
  );
}

/**
 * The filter form content — shared by the desktop sidebar and the mobile
 * drawer so the two surfaces can never drift out of sync. `lockedCategory`
 * / `lockedCollection` hide the corresponding section when the route
 * itself already fixes that facet (e.g. /shop/glassware).
 */
export function FilterPanel({
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
  const { categories, collections: curatedCollections } = useCatalog();
  const toggle = (key: MultiSelectKey, value: string) => {
    onChange((prev) => ({ ...prev, [key]: toggleValue(prev[key], value) }));
  };

  return (
    <div className="flex flex-col">
      {!lockedCategory && (
        <Disclosure title="Category" defaultOpen>
          <div className="flex flex-col gap-3">
            {categories.map((category) => (
              <label
                key={category.slug}
                className="flex cursor-pointer items-center justify-between gap-2 text-sm text-charcoal"
              >
                <span className="flex items-center gap-2.5">
                  <Checkbox
                    checked={filters.categories.includes(category.slug)}
                    onCheckedChange={() => toggle("categories", category.slug)}
                  />
                  {category.name}
                </span>
                <span className="text-xs text-stone">{category.itemCount}</span>
              </label>
            ))}
          </div>
        </Disclosure>
      )}

      {facets.productTypes.length > 0 && (
        <Disclosure title="Product Type">
          <div className="flex flex-col gap-3">
            {facets.productTypes.map((type) => (
              <label key={type} className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
                <Checkbox
                  checked={filters.productTypes.includes(type)}
                  onCheckedChange={() => toggle("productTypes", type)}
                />
                {type}
              </label>
            ))}
          </div>
        </Disclosure>
      )}

      {!lockedCollection && (
        <Disclosure title="Collection">
          <div className="flex flex-col gap-3">
            {curatedCollections.map((collection) => (
              <label
                key={collection.id}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal"
              >
                <Checkbox
                  checked={filters.collections.includes(collection.id)}
                  onCheckedChange={() => toggle("collections", collection.id)}
                />
                {collection.name}
              </label>
            ))}
          </div>
        </Disclosure>
      )}

      <Disclosure title="Price">
        <div className="flex items-center gap-3">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={formatPrice(facets.priceMin)}
            value={filters.priceMin ?? ""}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                priceMin: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="h-10 px-4 text-xs"
            aria-label="Minimum price"
          />
          <span className="text-stone" aria-hidden>
            –
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={formatPrice(facets.priceMax)}
            value={filters.priceMax ?? ""}
            onChange={(e) =>
              onChange((prev) => ({
                ...prev,
                priceMax: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
            className="h-10 px-4 text-xs"
            aria-label="Maximum price"
          />
        </div>
      </Disclosure>

      {facets.colors.length > 0 && (
        <Disclosure title="Colour">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((color) => (
              <OptionChip
                key={color}
                label={color}
                active={filters.colors.includes(color)}
                onClick={() => toggle("colors", color)}
              />
            ))}
          </div>
        </Disclosure>
      )}

      {facets.materials.length > 0 && (
        <Disclosure title="Material">
          <div className="flex flex-col gap-3">
            {facets.materials.map((material) => (
              <label key={material} className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
                <Checkbox
                  checked={filters.materials.includes(material)}
                  onCheckedChange={() => toggle("materials", material)}
                />
                {material}
              </label>
            ))}
          </div>
        </Disclosure>
      )}

      {facets.capacities.length > 0 && (
        <Disclosure title="Capacity">
          <div className="flex flex-wrap gap-2">
            {facets.capacities.map((capacity) => (
              <OptionChip
                key={capacity}
                label={capacity}
                active={filters.capacities.includes(capacity)}
                onClick={() => toggle("capacities", capacity)}
              />
            ))}
          </div>
        </Disclosure>
      )}

      {facets.setSizes.length > 0 && (
        <Disclosure title="Set Size">
          <div className="flex flex-wrap gap-2">
            {facets.setSizes.map((size) => (
              <OptionChip
                key={size}
                label={size}
                active={filters.setSizes.includes(size)}
                onClick={() => toggle("setSizes", size)}
              />
            ))}
          </div>
        </Disclosure>
      )}

      <Disclosure title="Availability">
        <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
          <Checkbox
            checked={filters.inStockOnly}
            onCheckedChange={(checked) => onChange((prev) => ({ ...prev, inStockOnly: checked }))}
          />
          In stock only
        </label>
      </Disclosure>

      <Disclosure title="Rating">
        <div className="flex flex-col gap-3">
          {[4, 3].map((threshold) => (
            <label key={threshold} className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
              <Checkbox
                checked={filters.minRating === threshold}
                onCheckedChange={(checked) =>
                  onChange((prev) => ({ ...prev, minRating: checked ? threshold : undefined }))
                }
              />
              <span className="flex items-center gap-1">
                {Array.from({ length: threshold }).map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5 fill-champagne-ink text-champagne-ink" />
                ))}
                <span className="ml-1 text-xs text-stone">& up</span>
              </span>
            </label>
          ))}
        </div>
      </Disclosure>

      <Disclosure title="Highlights">
        <div className="flex flex-col gap-3">
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
            <Checkbox
              checked={filters.isNew}
              onCheckedChange={(checked) => onChange((prev) => ({ ...prev, isNew: checked }))}
            />
            New arrivals
          </label>
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-charcoal">
            <Checkbox
              checked={filters.onSale}
              onCheckedChange={(checked) => onChange((prev) => ({ ...prev, onSale: checked }))}
            />
            Sale products
          </label>
        </div>
      </Disclosure>
    </div>
  );
}
