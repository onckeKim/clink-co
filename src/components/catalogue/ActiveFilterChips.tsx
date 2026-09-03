"use client";

import { X } from "lucide-react";
import { DEFAULT_FILTERS, type CatalogueFilters } from "@/lib/catalogue";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { formatPrice } from "@/lib/utils";

interface Chip {
  key: string;
  label: string;
  onRemove: () => void;
}

/** Removable chips reflecting every active filter, plus a "Clear all" — the visible mirror of the URL's filter state. */
export function ActiveFilterChips({
  filters,
  onChange,
  priceFloor,
  priceCeiling,
}: {
  filters: CatalogueFilters;
  onChange: (updater: (prev: CatalogueFilters) => CatalogueFilters) => void;
  priceFloor: number;
  priceCeiling: number;
}) {
  const { categories, collections: curatedCollections } = useCatalog();
  const chips: Chip[] = [];

  if (filters.search) {
    chips.push({
      key: "search",
      label: `"${filters.search}"`,
      onRemove: () => onChange((prev) => ({ ...prev, search: "" })),
    });
  }

  for (const slug of filters.categories) {
    const name = categories.find((c) => c.slug === slug)?.name ?? slug;
    chips.push({
      key: `category-${slug}`,
      label: name,
      onRemove: () => onChange((prev) => ({ ...prev, categories: prev.categories.filter((v) => v !== slug) })),
    });
  }

  for (const type of filters.productTypes) {
    chips.push({
      key: `type-${type}`,
      label: type,
      onRemove: () => onChange((prev) => ({ ...prev, productTypes: prev.productTypes.filter((v) => v !== type) })),
    });
  }

  for (const slug of filters.collections) {
    const name = curatedCollections.find((c) => c.id === slug)?.name ?? slug;
    chips.push({
      key: `collection-${slug}`,
      label: name,
      onRemove: () => onChange((prev) => ({ ...prev, collections: prev.collections.filter((v) => v !== slug) })),
    });
  }

  for (const color of filters.colors) {
    chips.push({
      key: `color-${color}`,
      label: color,
      onRemove: () => onChange((prev) => ({ ...prev, colors: prev.colors.filter((v) => v !== color) })),
    });
  }

  for (const material of filters.materials) {
    chips.push({
      key: `material-${material}`,
      label: material,
      onRemove: () => onChange((prev) => ({ ...prev, materials: prev.materials.filter((v) => v !== material) })),
    });
  }

  for (const capacity of filters.capacities) {
    chips.push({
      key: `capacity-${capacity}`,
      label: capacity,
      onRemove: () => onChange((prev) => ({ ...prev, capacities: prev.capacities.filter((v) => v !== capacity) })),
    });
  }

  for (const size of filters.setSizes) {
    chips.push({
      key: `set-${size}`,
      label: size,
      onRemove: () => onChange((prev) => ({ ...prev, setSizes: prev.setSizes.filter((v) => v !== size) })),
    });
  }

  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    const min = filters.priceMin ?? priceFloor;
    const max = filters.priceMax ?? priceCeiling;
    chips.push({
      key: "price",
      label: `${formatPrice(min)} – ${formatPrice(max)}`,
      onRemove: () => onChange((prev) => ({ ...prev, priceMin: undefined, priceMax: undefined })),
    });
  }

  if (filters.minRating !== undefined) {
    chips.push({
      key: "rating",
      label: `${filters.minRating}★ & up`,
      onRemove: () => onChange((prev) => ({ ...prev, minRating: undefined })),
    });
  }

  if (filters.inStockOnly) {
    chips.push({
      key: "availability",
      label: "In stock",
      onRemove: () => onChange((prev) => ({ ...prev, inStockOnly: false })),
    });
  }

  if (filters.isNew) {
    chips.push({
      key: "new",
      label: "New arrivals",
      onRemove: () => onChange((prev) => ({ ...prev, isNew: false })),
    });
  }

  if (filters.onSale) {
    chips.push({
      key: "sale",
      label: "Sale",
      onRemove: () => onChange((prev) => ({ ...prev, onSale: false })),
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={chip.onRemove}
          className="focus-ring inline-flex items-center gap-1.5 rounded-full border border-sand bg-white px-3 py-1.5 text-xs font-medium text-charcoal transition-colors hover:border-charcoal/40"
        >
          {chip.label}
          <X className="h-3 w-3" />
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange(() => DEFAULT_FILTERS)}
        className="focus-ring text-xs font-medium text-stone underline-offset-4 hover:text-charcoal hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}
