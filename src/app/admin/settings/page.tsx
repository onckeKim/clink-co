import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminSettingsView } from "@/components/admin/settings/AdminSettingsView";

export const metadata: Metadata = { title: "Store Settings", robots: { index: false, follow: false } };

export default async function AdminSettingsPage() {
  await requirePermission("settings:view");
  return <AdminSettingsView />;
}
