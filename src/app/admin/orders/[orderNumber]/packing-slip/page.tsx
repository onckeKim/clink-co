import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePermission } from "@/lib/supabase/dal";
import { getOrderByNumber } from "@/lib/orders/store";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { PackingSlipView } from "@/components/admin/orders/PackingSlipView";

export const metadata: Metadata = { title: "Packing Slip", robots: { index: false, follow: false } };

export default async function AdminPackingSlipPage({
  params,
}: PageProps<"/admin/orders/[orderNumber]/packing-slip">) {
  await requirePermission("orders:view");
  const { orderNumber } = await params;

  const order = getOrderByNumber(orderNumber);
  if (!order) notFound();

  return <PackingSlipView order={order} businessName={getStoreSettings().businessName} />;
}
