import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminPromotionsListView } from "@/components/admin/promotions/AdminPromotionsListView";

export const metadata: Metadata = { title: "Promotions" };

export default async function AdminPromotionsPage() {
  await requirePermission("promotions:view");
  return <AdminPromotionsListView />;
}
