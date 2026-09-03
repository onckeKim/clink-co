import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminMediaLibraryView } from "@/components/admin/media/AdminMediaLibraryView";

export const metadata: Metadata = { title: "Media Library" };

export default async function AdminMediaPage() {
  await requirePermission("media:view");
  return <AdminMediaLibraryView />;
}
