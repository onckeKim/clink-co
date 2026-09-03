import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminCustomerDetailView } from "@/components/admin/customers/AdminCustomerDetailView";

export const metadata: Metadata = { title: "Customer Detail" };

export default async function AdminCustomerDetailPage({ params }: PageProps<"/admin/customers/[id]">) {
  await requirePermission("customers:view");
  const { id } = await params;

  return <AdminCustomerDetailView customerId={id} />;
}
