import type { Metadata } from "next";
import { Logo } from "@/components/layout/Logo";
import { getStoreSettings } from "@/lib/admin/settings-store";

export const metadata: Metadata = { title: "We'll be right back" };

/** The full-site holding page proxy.ts rewrites every non-admin, non-API request to while maintenance mode is on (Store Settings → Maintenance mode). */
export default async function MaintenancePage() {
  const settings = await getStoreSettings();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-porcelain px-6 text-center">
      <Logo />
      <h1 className="font-display max-w-md text-display-lg text-charcoal">We&apos;ll be right back</h1>
      <p className="max-w-sm text-sm leading-relaxed text-stone">{settings.maintenanceMessage}</p>
    </div>
  );
}
