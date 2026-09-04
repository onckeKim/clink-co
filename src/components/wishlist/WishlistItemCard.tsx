"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, X } from "lucide-react";
import type { WishlistItem } from "@/store/wishlist-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { useCartStore } from "@/store/cart-store";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

export function WishlistItemCard({ item }: { item: WishlistItem }) {
  const removeItem = useWishlistStore((state) => state.remove);
  const addToCart = useCartStore((state) => state.addItem);
  const { products } = useCatalog();
  const product = products.find((p) => p.slug === item.slug);

  const moveToCart = () => {
    if (!product) return;
    addToCart(product);
    removeItem(item.productId);
  };

  return (
    <div className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand/40">
        <Link href={`/products/${item.slug}`} className="focus-ring block h-full w-full">
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </Link>
        <button
          type="button"
          onClick={() => removeItem(item.productId)}
          aria-label={`Remove ${item.name} from wishlist`}
          className="focus-ring absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-warm-white/90 text-charcoal backdrop-blur transition-colors hover:bg-warm-white"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {!product && <Badge variant="light">No longer available</Badge>}
          {product?.discontinued && <Badge variant="light">Discontinued</Badge>}
          {product && !product.discontinued && !product.inStock && <Badge variant="light">Out of stock</Badge>}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div>
          <Link href={`/products/${item.slug}`} className="focus-ring text-sm font-medium text-charcoal hover:underline">
            {item.name}
          </Link>
          <p className="mt-0.5 text-sm text-stone">{formatPrice(item.price)}</p>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!product || product.discontinued || !product.inStock}
          onClick={moveToCart}
        >
          <ShoppingBag className="h-3.5 w-3.5" />
          {product && !product.inStock ? "Out of stock" : "Move to cart"}
        </Button>
      </div>
    </div>
  );
}
