import "server-only";
import type { StoreSettings, StoreSettingsSocial } from "@/types/settings";
import * as db from "@/lib/db/settings";
import type { Database } from "@/lib/supabase/types";

/**
 * Thin async wrapper over src/lib/db/settings.ts (the real `store_settings`
 * table) — same pattern as src/lib/account/profiles-store.ts. Kept at its
 * original import path and export names so most call sites only needed
 * `await` added; the one behavioral change is `isMaintenanceModeOn()` is
 * gone from here — src/proxy.ts (edge/Node middleware, outside any request-
 * scoped React tree) now keeps its own short-lived cache of that one flag,
 * see the comment there.
 */

type StoreSettingsRow = Database["public"]["Tables"]["store_settings"]["Row"];

function fromRow(row: StoreSettingsRow): StoreSettings {
  return {
    businessName: row.business_name,
    logoUrl: row.logo_url ?? "",
    contactEmail: row.contact_email,
    contactPhone: row.contact_phone ?? "",
    currency: "ZAR",
    taxRatePercent: row.tax_rate_percent,
    freeDeliveryThreshold: row.free_delivery_threshold,
    enabledDeliveryMethodIds: row.enabled_delivery_method_ids,
    enabledPaymentMethodIds: row.enabled_payment_method_ids,
    emailSenderName: row.email_sender_name ?? "",
    emailSenderLocalPart: row.email_sender_local_part ?? "",
    orderNotificationEmail: row.order_notification_email ?? "",
    social: (row.social ?? {}) as unknown as StoreSettingsSocial,
    orderNumberPrefix: row.order_number_prefix,
    returnWindowDays: row.return_window_days,
    maintenanceMode: row.maintenance_mode,
    maintenanceMessage: row.maintenance_message ?? "",
    abandonedCartEnabled: row.abandoned_cart_enabled,
    abandonedCartDelayHours: row.abandoned_cart_delay_hours,
  };
}

export async function getStoreSettings(): Promise<StoreSettings> {
  const row = await db.getStoreSettings();
  return fromRow(row);
}

export async function updateStoreSettings(
  patch: Partial<Omit<StoreSettings, "social">> & { social?: Partial<StoreSettings["social"]> },
): Promise<StoreSettings> {
  let social: StoreSettingsSocial | undefined;
  if (patch.social) {
    const current = await db.getStoreSettings();
    social = { ...((current.social ?? {}) as unknown as StoreSettingsSocial), ...patch.social };
  }

  const row = await db.updateStoreSettings({
    business_name: patch.businessName,
    logo_url: patch.logoUrl,
    contact_email: patch.contactEmail,
    contact_phone: patch.contactPhone,
    tax_rate_percent: patch.taxRatePercent,
    free_delivery_threshold: patch.freeDeliveryThreshold,
    enabled_delivery_method_ids: patch.enabledDeliveryMethodIds,
    enabled_payment_method_ids: patch.enabledPaymentMethodIds,
    email_sender_name: patch.emailSenderName,
    email_sender_local_part: patch.emailSenderLocalPart,
    order_notification_email: patch.orderNotificationEmail,
    social: social as unknown as Database["public"]["Tables"]["store_settings"]["Row"]["social"],
    order_number_prefix: patch.orderNumberPrefix,
    return_window_days: patch.returnWindowDays,
    maintenance_mode: patch.maintenanceMode,
    maintenance_message: patch.maintenanceMessage,
    abandoned_cart_enabled: patch.abandonedCartEnabled,
    abandoned_cart_delay_hours: patch.abandonedCartDelayHours,
  });
  return fromRow(row);
}
