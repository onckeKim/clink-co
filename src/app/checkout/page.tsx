import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order.",
};

export default function CheckoutPage() {
  return <CheckoutView />;
}
