import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminOrdersListView } from "@/components/admin/orders/AdminOrdersListView";

export const metadata: Metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  await requirePermission("orders:view");
  return <AdminOrdersListView />;
}
