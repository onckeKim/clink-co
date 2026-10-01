import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminPromotionsListView } from "@/components/admin/promotions/AdminPromotionsListView";

export const metadata: Metadata = { title: "Promotions", robots: { index: false, follow: false } };

export default async function AdminPromotionsPage() {
  await requirePermission("promotions:view");
  return <AdminPromotionsListView />;
}
