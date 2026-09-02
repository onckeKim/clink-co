import type { Metadata } from "next";
import { OrdersListView } from "@/components/account/OrdersListView";

export const metadata: Metadata = {
  title: "Order History",
};

export default function AccountOrdersPage() {
  return <OrdersListView />;
}
