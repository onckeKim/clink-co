import type { Metadata } from "next";
import { InvoiceView } from "@/components/account/InvoiceView";

export const metadata: Metadata = {
  title: "Invoice",
};

export default async function AccountOrderInvoicePage({
  params,
}: PageProps<"/account/orders/[orderNumber]/invoice">) {
  const { orderNumber } = await params;
  return <InvoiceView orderNumber={orderNumber} />;
}
