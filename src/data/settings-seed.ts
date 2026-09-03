import type { StoreSettings } from "@/types/settings";
import { siteConfig } from "@/config/site";

/** Seed data for the store settings store (src/lib/admin/settings-store.ts) — mirrors the previously-static src/config/site.ts values as the starting point. */
export const settingsSeed: StoreSettings = {
  businessName: siteConfig.fullName,
  logoUrl: "",
  contactEmail: siteConfig.contactEmail,
  contactPhone: "",
  currency: siteConfig.currency,
  taxRatePercent: siteConfig.taxRatePercent,
  freeDeliveryThreshold: siteConfig.freeDeliveryThreshold,
  enabledDeliveryMethodIds: ["standard", "express", "pickup"],
  enabledPaymentMethodIds: ["test", "eft", "payfast", "ozow", "yoco", "peach"],
  emailSenderName: siteConfig.name,
  emailSenderLocalPart: "orders",
  orderNotificationEmail: siteConfig.orderNotificationEmail,
  social: {
    instagram: siteConfig.social.instagram,
    facebook: siteConfig.social.facebook,
    tiktok: siteConfig.social.tiktok,
    pinterest: siteConfig.social.pinterest,
    whatsapp: siteConfig.social.whatsapp,
  },
  orderNumberPrefix: "CC",
  returnWindowDays: siteConfig.returnWindowDays,
  maintenanceMode: false,
  maintenanceMessage: "We're carrying out some scheduled maintenance and will be back shortly. Thanks for your patience.",
};
