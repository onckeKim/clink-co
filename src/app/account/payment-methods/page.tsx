import type { Metadata } from "next";
import { PaymentMethodsView } from "@/components/account/PaymentMethodsView";

export const metadata: Metadata = {
  title: "Payment Methods",
  robots: { index: false, follow: false },
};

export default function AccountPaymentMethodsPage() {
  return <PaymentMethodsView />;
}
