import type { Metadata } from "next";
import { CartPageView } from "@/components/cart/CartPageView";

export const metadata: Metadata = {
  title: "Your Bag",
  description: "Review your bag before checking out.",
};

export default function CartPage() {
  return <CartPageView />;
}
