"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";
import { getProductBySlug } from "@/data/products";
import { useWishlistStore } from "@/store/wishlist-store";
import { ProductCard } from "@/components/product/ProductCard";
import { Button, buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/** Read-only view of someone else's shared wishlist — the URL just encodes product slugs, no account/backend involved. */
export function SharedWishlistView() {
  const searchParams = useSearchParams();
  const slugs = (searchParams.get("items") ?? "")
    .split(",")
    .map((slug) => slug.trim())
    .filter(Boolean);
  const products = slugs
    .map((slug) => getProductBySlug(slug))
    .filter((product): product is NonNullable<typeof product> => Boolean(product));

  const addToMyWishlist = useWishlistStore((state) => state.add);

  const handleAddAll = () => {
    for (const product of products) {
      addToMyWishlist({
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0],
        price: product.price,
      });
    }
  };

  if (products.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center sm:px-8">
        <Heart className="mx-auto h-10 w-10 text-stone" strokeWidth={1.5} aria-hidden />
        <p className="font-display mt-4 text-xl text-charcoal">This wishlist link isn&apos;t valid</p>
        <p className="mt-2 text-sm text-stone">The link may be broken, or the wishlist is empty.</p>
        <Link href="/shop" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Shared wishlist</p>
          <h1 className="font-display mt-2 text-display-lg text-charcoal">
            {products.length} {products.length === 1 ? "item" : "items"}
          </h1>
        </div>
        <Button type="button" onClick={handleAddAll}>
          Add all to my wishlist
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} detailed />
        ))}
      </div>
    </div>
  );
}
