import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import type { StoreSettings } from "@/types/settings";
import type { Category } from "@/types/category";
import type { CuratedCollection } from "@/types/collection";
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

/** Renders `ui` wrapped in <StoreSettingsProvider> and <CatalogProvider> with fixture data — for any component tree that calls useStoreSettings() and/or useCatalog(). */
export function renderWithStoreSettings(ui: ReactElement, options?: RenderOptions) {
  return render(
    <StoreSettingsProvider settings={mockStoreSettings}>
      <CatalogProvider categories={mockCategories} collections={mockCollections}>
        {ui}
      </CatalogProvider>
    </StoreSettingsProvider>,
    options,
  );
}

/** Renders `ui` wrapped in just <CatalogProvider> with fixture data — for component trees that call useCatalog() but not useStoreSettings(). */
export function renderWithCatalog(ui: ReactElement, options?: RenderOptions) {
  return render(
    <CatalogProvider categories={mockCategories} collections={mockCollections}>
      {ui}
    </CatalogProvider>,
    options,
  );
}
