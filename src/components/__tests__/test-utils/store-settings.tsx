import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import type { StoreSettings } from "@/types/settings";
import type { Category } from "@/types/category";
import type { CuratedCollection } from "@/types/collection";
import type { Product } from "@/types/product";
import { StoreSettingsProvider } from "@/components/providers/StoreSettingsProvider";
import { CatalogProvider } from "@/components/providers/CatalogProvider";

/** Fixture settings for components rendered under <StoreSettingsProvider> in tests — mirrors supabase/seed.sql's store_settings defaults. */
export const mockStoreSettings: StoreSettings = {
  businessName: "Clink & Co",
  logoUrl: "",
  contactEmail: "hello@clinkandco.com",
  contactPhone: "+27 21 555 0100",
  currency: "ZAR",
  taxRatePercent: 15,
  freeDeliveryThreshold: 950,
  enabledDeliveryMethodIds: ["standard", "express", "pickup"],
  enabledPaymentMethodIds: ["test", "eft", "payfast", "ozow", "yoco", "peach"],
  emailSenderName: "Clink & Co",
  emailSenderLocalPart: "hello",
  orderNotificationEmail: "orders@clinkandco.com",
  social: {
    instagram: "https://instagram.com/clinkandco",
    facebook: "https://facebook.com/clinkandco",
    tiktok: "https://tiktok.com/@clinkandco",
    pinterest: "https://pinterest.com/clinkandco",
    whatsapp: "https://wa.me/27215550100",
  },
  orderNumberPrefix: "CC",
  returnWindowDays: 30,
  maintenanceMode: false,
  maintenanceMessage: "We're making some updates and will be back shortly.",
  abandonedCartEnabled: false,
  abandonedCartDelayHours: 24,
};

/** Fixture categories for components rendered under <CatalogProvider> in tests — mirrors data/categories-seed.ts's slugs. */
export const mockCategories: Category[] = [
  { id: "cat-glassware", slug: "glassware", name: "Glassware", description: "", image: "", sortOrder: 0, itemCount: 0 },
  { id: "cat-barware", slug: "barware", name: "Barware", description: "", image: "", sortOrder: 1, itemCount: 0 },
  { id: "cat-tableware", slug: "tableware", name: "Tableware", description: "", image: "", sortOrder: 2, itemCount: 0 },
];

/** Fixture curated collections for components rendered under <CatalogProvider> in tests — mirrors data/collections-seed.ts's ids. */
export const mockCollections: CuratedCollection[] = [
  { id: "home-bar-edit", name: "The Home Bar Edit", description: "", image: "", href: "/collections/home-bar-edit" },
  { id: "everyday-elegance", name: "Everyday Elegance", description: "", image: "", href: "/collections/everyday-elegance" },
];

/** Fixture products for components rendered under <CatalogProvider> in tests — mirrors a couple of data/products-seed.ts entries (SearchModal.test.tsx searches for these by name). */
export const mockProducts: Product[] = [
  {
    id: "prod-solstice-coupe",
    slug: "solstice-coupe-glasses",
    sku: "CC-GLS-001",
    name: "Solstice Coupe Glasses",
    shortDescription: "Set of 4, hand-finished rims",
    description: "A wide, shallow bowl balanced on a slender stem.",
    price: 1450,
    currency: "ZAR",
    images: ["/images/products/solstice-coupe-glasses-1.svg"],
    categorySlug: "glassware",
    productType: "Champagne Glasses",
    collectionSlugs: [],
    stockQuantity: 42,
    inStock: true,
    featured: true,
    badges: ["Bestseller"],
    tags: ["coupe", "champagne", "sparkling wine"],
    careInstructions: ["Hand wash recommended"],
  },
  {
    id: "prod-meridian-shaker",
    slug: "meridian-cocktail-shaker",
    sku: "CC-BAR-001",
    name: "Meridian Cocktail Shaker",
    shortDescription: "Brushed stainless, 710 ml",
    description: "A three-piece Cobbler shaker with a built-in strainer.",
    price: 1750,
    currency: "ZAR",
    images: ["/images/products/meridian-cocktail-shaker-1.svg"],
    categorySlug: "barware",
    productType: "Shakers",
    collectionSlugs: [],
    stockQuantity: 35,
    inStock: true,
    featured: true,
    badges: ["Bestseller"],
    tags: ["shaker", "cocktail", "bar tool"],
    careInstructions: ["Hand wash recommended"],
  },
];

/** Renders `ui` wrapped in <StoreSettingsProvider> and <CatalogProvider> with fixture data — for any component tree that calls useStoreSettings() and/or useCatalog(). */
export function renderWithStoreSettings(ui: ReactElement, options?: RenderOptions) {
  return render(
    <StoreSettingsProvider settings={mockStoreSettings}>
      <CatalogProvider categories={mockCategories} collections={mockCollections} products={mockProducts}>
        {ui}
      </CatalogProvider>
    </StoreSettingsProvider>,
    options,
  );
}

/** Renders `ui` wrapped in just <CatalogProvider> with fixture data — for component trees that call useCatalog() but not useStoreSettings(). */
export function renderWithCatalog(ui: ReactElement, options?: RenderOptions) {
  return render(
    <CatalogProvider categories={mockCategories} collections={mockCollections} products={mockProducts}>
      {ui}
    </CatalogProvider>,
    options,
  );
}
