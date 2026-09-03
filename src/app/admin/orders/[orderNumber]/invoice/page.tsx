import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/supabase/dal";
import { getOrderByNumber } from "@/lib/orders/store";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { AdminInvoiceView } from "@/components/admin/orders/AdminInvoiceView";

export const metadata: Metadata = { title: "Invoice" };

export default async function AdminOrderInvoicePage({ params }: PageProps<"/admin/orders/[orderNumber]/invoice">) {
  await requirePermission("orders:view");
  const { orderNumber } = await params;

  const order = getOrderByNumber(orderNumber);
  if (!order) notFound();

  return <AdminInvoiceView order={order} contactEmail={getStoreSettings().contactEmail} />;
}
