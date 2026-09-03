import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import type { StoreSettings } from "@/types/settings";
import { StoreSettingsProvider } from "@/components/providers/StoreSettingsProvider";

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

/** Renders `ui` wrapped in <StoreSettingsProvider> with fixture settings — for any component tree that calls useStoreSettings(). */
export function renderWithStoreSettings(ui: ReactElement, options?: RenderOptions) {
  return render(<StoreSettingsProvider settings={mockStoreSettings}>{ui}</StoreSettingsProvider>, options);
}
