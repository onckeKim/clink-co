import type { Metadata } from "next";
import { WishlistPageView } from "@/components/wishlist/WishlistPageView";

export const metadata: Metadata = {
  title: "Your Wishlist",
  description: "Products you've saved for later.",
};

export default function WishlistPage() {
  return <WishlistPageView />;
}
