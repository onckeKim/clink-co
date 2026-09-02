import type { Metadata } from "next";
import { OrderDetailView } from "@/components/account/OrderDetailView";

export const metadata: Metadata = {
  title: "Order Details",
};

export default async function AccountOrderDetailPage({ params }: PageProps<"/account/orders/[orderNumber]">) {
  const { orderNumber } = await params;
  return <OrderDetailView orderNumber={orderNumber} />;
}
