import { Suspense } from "react";
import type { Metadata } from "next";
import { SharedWishlistView } from "@/components/wishlist/SharedWishlistView";

export const metadata: Metadata = {
  title: "Shared Wishlist",
  description: "A wishlist shared by a Clink & Co customer.",
};

export default function SharedWishlistPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-7xl px-6 py-10 sm:px-8" />}>
      <SharedWishlistView />
    </Suspense>
  );
}
