import type { DeliveryMethodId } from "@/config/delivery";
import type { PaymentMethodId } from "@/lib/orders/types";

export interface StoreSettingsSocial {
  instagram: string;
  facebook: string;
  tiktok: string;
  pinterest: string;
  whatsapp: string;
}

export interface StoreSettings {
  businessName: string;
  /** Optional logo image URL — the header currently renders a text wordmark, so this is captured for when a logo image is wired in, not yet displayed. */
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  currency: "ZAR";
  /** Whole percent — e.g. 15 for 15% VAT. */
  taxRatePercent: number;
  /** In the site currency (ZAR). */
  freeDeliveryThreshold: number;
  /** Which of the configured delivery methods (src/config/delivery.ts) are currently offered at checkout. */
  enabledDeliveryMethodIds: DeliveryMethodId[];
  /** Which of the configured payment providers (src/lib/payments/) are currently offered at checkout — still gated by that provider's own isConfigured() check underneath. */
  enabledPaymentMethodIds: PaymentMethodId[];
  emailSenderName: string;
  /** Local part only — combined with the site's domain when sending, see src/lib/email.ts. */
  emailSenderLocalPart: string;
  orderNotificationEmail: string;
  social: StoreSettingsSocial;
  /** Prefixes every generated order number, e.g. "CC" → "CC-250304-0001". */
  orderNumberPrefix: string;
  returnWindowDays: number;
  maintenanceMode: boolean;
  /** Shown on the maintenance-mode holding page when maintenanceMode is on. */
  maintenanceMessage: string;
}
