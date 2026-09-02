"use client";

import Image from "next/image";
import Link from "next/link";
import { Eye, Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/Badge";
import { Rating } from "@/components/ui/Rating";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useRecentlyViewedStore } from "@/store/recently-viewed-store";
import { getCategoryBySlug } from "@/data/categories";
import { useMounted } from "@/lib/hooks/use-mounted";
import { cn, formatPrice } from "@/lib/utils";

export function ProductCard({
  product,
  className,
  inverse = false,
  detailed = false,
  onQuickView,
}: {
  product: Product;
  className?: string;
  inverse?: boolean;
  /** Adds rating, colour/style swatches and a discount badge — used in the Bestsellers carousel. */
  detailed?: boolean;
  /** Renders a quick-view icon button that calls back with this product — used in the shop grid. */
  onQuickView?: (product: Product) => void;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const mounted = useMounted();
  // Wishlist state is persisted to localStorage, which isn't available
  // during SSR — reporting "not wishlisted" until mounted avoids a
  // hydration mismatch on the heart icon for a product added on a
  // previous visit.
  const wishlisted = useWishlistStore((state) => state.has(product.id)) && mounted;
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const recordView = useRecentlyViewedStore((state) => state.add);
  const secondImage = product.images[1] ?? product.images[0];
  const categoryName = getCategoryBySlug(product.categorySlug)?.name;
  const discountPercent = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  return (
    <div className={cn("group flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand/40">
        <Link
          href={`/products/${product.slug}`}
          onClick={() => recordView(product)}
          className="focus-ring relative block h-full w-full"
        >
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-opacity duration-500 ease-out group-hover:opacity-0"
          />
          <Image
            src={secondImage}
            alt=""
            aria-hidden
            fill
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
          />
        </Link>

        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {!product.inStock && <Badge variant="light">Out of stock</Badge>}
          {discountPercent !== null && <Badge variant="sale">-{discountPercent}%</Badge>}
          {product.badges?.map((badge) => (
            <Badge key={badge} variant={badge === "Bestseller" ? "dark" : "champagne"}>
              {badge}
            </Badge>
          ))}
        </div>

        <div className="absolute right-3 top-3 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
            aria-pressed={wishlisted}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-warm-white/90 text-charcoal opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 sm:opacity-100"
          >
            <Heart className={cn("h-4 w-4", wishlisted && "fill-charcoal")} />
          </button>
          {onQuickView && (
            <button
              type="button"
              onClick={() => onQuickView(product)}
              aria-label={`Quick view ${product.name}`}
              className="focus-ring flex h-9 w-9 items-center justify-center rounded-full bg-warm-white/90 text-charcoal opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          disabled={!product.inStock}
          onClick={() => addItem(product)}
          className={cn(
            "focus-ring absolute inset-x-3 bottom-3 flex translate-y-14 items-center justify-center gap-2 rounded-full py-2.5 text-xs font-semibold uppercase tracking-wide opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100 disabled:cursor-not-allowed sm:translate-y-14",
            inverse ? "bg-warm-white text-charcoal disabled:bg-warm-white/40" : "bg-charcoal text-warm-white disabled:bg-stone",
          )}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {product.inStock ? "Quick add" : "Notify me"}
        </button>
      </div>

      <Link
        href={`/products/${product.slug}`}
        onClick={() => recordView(product)}
        className="focus-ring mt-4 flex flex-col gap-1"
      >
        {categoryName && (
          <span
            className={cn(
              "text-[11px] font-semibold uppercase tracking-[0.14em]",
              inverse ? "text-warm-white/45" : "text-stone",
            )}
          >
            {categoryName}
          </span>
        )}
        <div className="flex items-start justify-between gap-2">
          <h3 className={cn("text-sm font-medium", inverse ? "text-warm-white" : "text-charcoal")}>
            {product.name}
          </h3>
          <div className="flex shrink-0 items-baseline gap-1.5">
            {product.compareAtPrice && (
              <span className={cn("text-xs line-through", inverse ? "text-warm-white/40" : "text-stone")}>
                {formatPrice(product.compareAtPrice)}
              </span>
            )}
            <span className={cn("text-sm font-medium", inverse ? "text-warm-white" : "text-charcoal")}>
              {formatPrice(product.price)}
            </span>
          </div>
        </div>
        <p className={cn("text-xs", inverse ? "text-warm-white/50" : "text-stone")}>{product.shortDescription}</p>

        {detailed && product.rating !== undefined && (
          <Rating value={product.rating} count={product.reviewCount} size="xs" inverse={inverse} className="mt-1" />
        )}

        {detailed && product.variants && product.variants.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1.5" aria-hidden>
            {product.variants.map((variant) => (
              <span
                key={variant.id}
                title={variant.label}
                className={cn(
                  "h-3.5 w-3.5 rounded-full border",
                  inverse ? "border-warm-white/30" : "border-charcoal/15",
                )}
                style={{ backgroundColor: variant.swatch }}
              />
            ))}
            <span className={cn("text-[11px]", inverse ? "text-warm-white/50" : "text-stone")}>
              {product.variants.length} {product.variants.length === 1 ? "colour" : "colours"}
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}
