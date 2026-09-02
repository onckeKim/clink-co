"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { getCategoryBySlug } from "@/data/categories";
import { cn, formatPrice } from "@/lib/utils";

/** A lightweight preview of the full PDP, opened from a product card's quick-view button without leaving the grid. */
export function QuickView({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const addItem = useCartStore((state) => state.addItem);
  const wishlisted = useWishlistStore((state) => state.has(product?.id ?? ""));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const [selectedVariantId, setSelectedVariantId] = React.useState<string | undefined>(
    product?.variants?.[0]?.id,
  );

  // Reset the selected variant when a new product is shown — adjusted
  // during render (not an effect) per React's "resetting state when a
  // prop changes" pattern.
  const [lastProductId, setLastProductId] = React.useState(product?.id);
  if (product?.id !== lastProductId) {
    setLastProductId(product?.id);
    setSelectedVariantId(product?.variants?.[0]?.id);
  }

  const open = Boolean(product);

  if (!product) return null;

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const displayPrice = product.price + (selectedVariant?.priceDelta ?? 0);
  const categoryName = getCategoryBySlug(product.categorySlug)?.name;
  const discountPercent = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  return (
    <Modal open={open} onClose={onClose} className="max-w-2xl p-0">
      <div className="grid sm:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-t-3xl bg-sand/40 sm:rounded-l-3xl sm:rounded-tr-none">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 640px) 320px, 100vw"
            className="object-cover"
          />
          <div className="absolute left-4 top-4 flex flex-col gap-1.5">
            {!product.inStock && <Badge variant="light">Out of stock</Badge>}
            {discountPercent !== null && <Badge variant="sale">-{discountPercent}%</Badge>}
            {product.badges?.map((badge) => (
              <Badge key={badge} variant={badge === "Bestseller" ? "dark" : "champagne"}>
                {badge}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 p-6 sm:p-8">
          {categoryName && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone">
              {categoryName}
            </span>
          )}

          <div>
            <h2 className="font-display text-display-md text-charcoal">{product.name}</h2>
            {product.rating !== undefined && (
              <Rating value={product.rating} count={product.reviewCount} size="sm" className="mt-2" />
            )}
          </div>

          <div className="flex items-baseline gap-2">
            {product.compareAtPrice && (
              <span className="text-sm text-stone line-through">{formatPrice(product.compareAtPrice)}</span>
            )}
            <span className="text-lg font-medium text-charcoal">{formatPrice(displayPrice)}</span>
          </div>

          <p className="text-sm leading-relaxed text-stone">{product.shortDescription}</p>

          {product.variants && product.variants.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone">
                Colour{selectedVariant ? `: ${selectedVariant.label}` : ""}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant) => (
                  <button
                    key={variant.id}
                    type="button"
                    onClick={() => setSelectedVariantId(variant.id)}
                    aria-label={variant.label}
                    aria-pressed={selectedVariantId === variant.id}
                    className={cn(
                      "focus-ring flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors",
                      selectedVariantId === variant.id ? "border-charcoal" : "border-transparent",
                    )}
                  >
                    <span
                      className="h-6 w-6 rounded-full border border-charcoal/15"
                      style={{ backgroundColor: variant.swatch }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {!product.variants?.length && product.colors && product.colors.length > 0 && (
            <p className="text-xs text-stone">Available in: {product.colors.join(", ")}</p>
          )}

          <div className="mt-auto flex items-center gap-3 pt-2">
            <Button
              type="button"
              disabled={!product.inStock}
              onClick={() => addItem(product, { variant: selectedVariant })}
              className="flex-1"
            >
              <ShoppingBag className="h-4 w-4" />
              {product.inStock ? "Add to cart" : "Notify me"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => toggleWishlist(product)}
              aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
              aria-pressed={wishlisted}
            >
              <Heart className={cn("h-4 w-4", wishlisted && "fill-charcoal")} />
            </Button>
          </div>

          <Link
            href={`/products/${product.slug}`}
            onClick={onClose}
            className="focus-ring text-center text-sm font-medium text-charcoal underline-offset-4 hover:underline"
          >
            View full details
          </Link>
        </div>
      </div>
    </Modal>
  );
}
