"use client";

import * as React from "react";
import { Check, Heart, Share2, ShoppingBag, Zap } from "lucide-react";
import type { Product, ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { cn } from "@/lib/utils";

export function PurchaseActions({
  product,
  variant,
  quantity,
}: {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const openCart = useCartStore((state) => state.open);
  const wishlisted = useWishlistStore((state) => state.has(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const [justShared, setJustShared] = React.useState(false);

  const disabled = !product.inStock || Boolean(product.discontinued);

  const handleAddToCart = () => addItem(product, { variant, quantity });

  const handleBuyNow = () => {
    // No dedicated checkout flow exists yet (see README's roadmap) — Buy
    // Now adds the item and opens the cart drawer as today's fastest path
    // to purchase; swap this for a router.push("/checkout") once that
    // route ships.
    addItem(product, { variant, quantity });
    openCart();
  };

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: product.name, text: product.shortDescription, url });
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
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Button type="button" size="lg" disabled={disabled} onClick={handleAddToCart} className="flex-1">
          <ShoppingBag className="h-4 w-4" />
          {product.discontinued ? "Discontinued" : product.inStock ? "Add to cart" : "Notify me"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className="h-13 w-13 shrink-0"
        >
          <Heart className={cn("h-4 w-4", wishlisted && "fill-charcoal")} />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          onClick={handleShare}
          aria-label="Share this product"
          className="h-13 w-13 shrink-0"
        >
          {justShared ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        </Button>
      </div>

      {!disabled && (
        <Button type="button" variant="secondary" size="lg" onClick={handleBuyNow}>
          <Zap className="h-4 w-4" />
          Buy now
        </Button>
      )}
    </div>
  );
}
