"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Heart, Share2 } from "lucide-react";
import { useWishlistStore } from "@/store/wishlist-store";
import { WishlistItemCard } from "@/components/wishlist/WishlistItemCard";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { Button, buttonVariants } from "@/components/ui/Button";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn } from "@/lib/utils";

export function WishlistPageView() {
  const mounted = useMounted();
  const items = useWishlistStore((state) => state.items);
  const [justShared, setJustShared] = React.useState(false);

  const shareWishlist = async () => {
    const slugs = items.map((item) => item.slug).join(",");
    const url = `${window.location.origin}/wishlist/shared?items=${encodeURIComponent(slugs)}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "My Clink & Co wishlist", url });
      } catch {
        // Visitor cancelled the native share sheet — nothing to do.
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setJustShared(true);
      window.setTimeout(() => setJustShared(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Wishlist" }]} className="mb-6" />

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-display-lg text-charcoal">Your Wishlist</h1>
        {mounted && items.length > 0 && (
          <Button type="button" variant="secondary" onClick={shareWishlist}>
            {justShared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
            {justShared ? "Link copied" : "Share wishlist"}
          </Button>
        )}
      </div>

      {!mounted ? (
        <div
          className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4"
          aria-busy="true"
          aria-label="Loading your wishlist"
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-3">
              <div className="aspect-[4/5] animate-pulse rounded-2xl bg-sand/50" />
              <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-sand/50" />
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-sand py-24 text-center">
          <Heart className="h-10 w-10 text-stone" strokeWidth={1.5} aria-hidden />
          <div>
            <p className="font-display text-xl text-charcoal">Your wishlist is empty</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone">
              Tap the heart on anything you&apos;re not ready to buy just yet.
            </p>
          </div>
          <Link href="/shop" className={cn(buttonVariants({ size: "lg" }))}>
            Browse the shop
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((item) => (
            <WishlistItemCard key={item.productId} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
