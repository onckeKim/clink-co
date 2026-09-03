import type { Metadata } from "next";
import { requirePermission } from "@/lib/supabase/dal";
import { AdminOrderDetailView } from "@/components/admin/orders/AdminOrderDetailView";

export const metadata: Metadata = { title: "Order Detail", robots: { index: false, follow: false } };

export default async function AdminOrderDetailPage({ params }: PageProps<"/admin/orders/[orderNumber]">) {
  await requirePermission("orders:view");
  const { orderNumber } = await params;

  return <AdminOrderDetailView orderNumber={orderNumber} />;
}
