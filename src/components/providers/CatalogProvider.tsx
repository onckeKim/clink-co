"use client";

import * as React from "react";
import type { Category } from "@/types/category";
import type { CuratedCollection } from "@/types/collection";

/**
 * Makes categories/collections, fetched once server-side in the root
 * layout, available to client components that need them mid-render
 * (ProductCard, SearchModal, FilterPanel, MobileDrawer, ...) — same
 * rationale as StoreSettingsProvider. Unlike store settings this is two
 * small lists rather than one object, so callers get the raw arrays back
 * and do their own `.find()`/`.filter()`, matching how the pre-DB
 * synchronous getCategories()/getCategoryBySlug() were used.
 */
export interface Catalog {
  categories: Category[];
  collections: CuratedCollection[];
}

const CatalogContext = React.createContext<Catalog | null>(null);

export function CatalogProvider({
  categories,
  collections,
  children,
}: Catalog & { children: React.ReactNode }) {
  const value = React.useMemo(() => ({ categories, collections }), [categories, collections]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

/** Throws if called outside CatalogProvider — every client component that needs the catalog renders under the root layout, so a missing provider means a real wiring bug, not a legitimate "no data yet" state. */
export function useCatalog(): Catalog {
  const catalog = React.useContext(CatalogContext);
  if (!catalog) throw new Error("useCatalog() called outside <CatalogProvider>.");
  return catalog;
}
