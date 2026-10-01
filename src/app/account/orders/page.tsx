import type { Metadata } from "next";
import { OrdersListView } from "@/components/account/OrdersListView";

export const metadata: Metadata = {
  title: "Order History",
  robots: { index: false, follow: false },
};

export default function AccountOrdersPage() {
  return <OrdersListView />;
}
