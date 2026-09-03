import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminCustomersListView } from "@/components/admin/customers/AdminCustomersListView";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  await requirePermission("customers:view");
  return <AdminCustomersListView />;
}
