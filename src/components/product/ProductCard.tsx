"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, ShoppingBag } from "lucide-react";
import type { Product } from "@/types/product";
import { Badge } from "@/components/ui/Badge";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { cn, formatPrice } from "@/lib/utils";

export function ProductCard({
  product,
  className,
  inverse = false,
}: {
  product: Product;
  className?: string;
  inverse?: boolean;
}) {
  const addItem = useCartStore((state) => state.addItem);
  const wishlisted = useWishlistStore((state) => state.has(product.id));
  const toggleWishlist = useWishlistStore((state) => state.toggle);
  const secondImage = product.images[1] ?? product.images[0];

  return (
    <div className={cn("group flex flex-col", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand/40">
        <Link href={`/product/${product.slug}`} className="focus-ring relative block h-full w-full">
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
          {product.compareAtPrice && <Badge variant="sale">Sale</Badge>}
          {product.badges?.map((badge) => (
            <Badge key={badge} variant={badge === "Bestseller" ? "dark" : "champagne"}>
              {badge}
            </Badge>
          ))}
        </div>

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={wishlisted}
          className="focus-ring absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-warm-white/90 text-charcoal opacity-0 backdrop-blur transition-all duration-300 group-hover:opacity-100 sm:opacity-100"
        >
          <Heart className={cn("h-4 w-4", wishlisted && "fill-charcoal")} />
        </button>

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

      <Link href={`/product/${product.slug}`} className="focus-ring mt-4 flex flex-col gap-1">
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
        <p className={cn("text-xs", inverse ? "text-warm-white/50" : "text-stone")}>{product.tagline}</p>
      </Link>
    </div>
  );
}
