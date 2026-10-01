import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { CollectionsListView } from "@/components/admin/collections/CollectionsListView";

export const metadata: Metadata = { title: "Collections", robots: { index: false, follow: false } };

export default async function AdminCollectionsPage() {
  await requirePermission("collections:view");
  return <CollectionsListView />;
}
