"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Minus, Plus } from "lucide-react";
import type { CartLine } from "@/store/cart-store";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import { getProductBySlug } from "@/data/products";
import { LOW_STOCK_THRESHOLD } from "@/components/product/StockStatus";
import { cn, formatPrice } from "@/lib/utils";

export function CartLineItem({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeLine = useCartStore((state) => state.removeLine);
  const addWishlistItem = useWishlistStore((state) => state.add);

  // Live stock/availability lookup — the cart line itself only stores what
  // was true when the item was added, so stock changes since then (or a
  // product going out of stock) show up here without a stale cache.
  const product = getProductBySlug(line.slug);
  const outOfStock = product ? !product.inStock : false;
  const stockQuantity = product?.stockQuantity ?? Infinity;
  const lowStock = !outOfStock && Number.isFinite(stockQuantity) && stockQuantity <= LOW_STOCK_THRESHOLD;
  const exceedsStock = !outOfStock && line.quantity > stockQuantity;

  const moveToWishlist = () => {
    addWishlistItem({
      productId: line.productId,
      slug: line.slug,
      name: line.name,
      image: line.image,
      price: line.price,
    });
    removeLine(line.lineId);
  };

  return (
    <li className={cn("flex gap-4", compact ? "py-5" : "py-6")}>
      <Link
        href={`/products/${line.slug}`}
        className={cn(
          "focus-ring relative shrink-0 overflow-hidden rounded-xl bg-sand/50",
          compact ? "h-24 w-20" : "h-32 w-28",
        )}
      >
        <Image src={line.image} alt={line.name} fill sizes="120px" className="object-cover" />
      </Link>

      <div className="flex flex-1 flex-col justify-between gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={`/products/${line.slug}`}
              className="focus-ring text-sm font-medium text-charcoal hover:underline"
            >
              {line.name}
            </Link>
            {line.variant && <p className="mt-0.5 text-xs text-stone">{line.variant.label}</p>}
            <p className="mt-0.5 text-xs text-stone">{formatPrice(line.price)} each</p>
          </div>
          <p className="shrink-0 text-sm font-medium text-charcoal">{formatPrice(line.price * line.quantity)}</p>
        </div>

        {outOfStock && (
          <p className="text-xs font-medium text-error">Now out of stock — remove or save for later</p>
        )}
        {exceedsStock && (
          <p className="text-xs font-medium text-error">
            Only {stockQuantity} left —{" "}
            <button
              type="button"
              onClick={() => updateQuantity(line.lineId, stockQuantity, stockQuantity)}
              className="underline underline-offset-2"
            >
              reduce to {stockQuantity}
            </button>
          </p>
        )}
        {!exceedsStock && lowStock && (
          <p className="text-xs font-medium text-champagne">Only {stockQuantity} left in stock</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 rounded-full border border-sand px-2 py-1">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={outOfStock}
              onClick={() => updateQuantity(line.lineId, line.quantity - 1, stockQuantity)}
              className="focus-ring flex h-6 w-6 items-center justify-center rounded-full hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-4 text-center text-xs">{line.quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              disabled={outOfStock || line.quantity >= stockQuantity}
              onClick={() => updateQuantity(line.lineId, line.quantity + 1, stockQuantity)}
              className="focus-ring flex h-6 w-6 items-center justify-center rounded-full hover:bg-sand disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone">
            <button
              type="button"
              onClick={moveToWishlist}
              className="focus-ring flex items-center gap-1 underline-offset-2 hover:text-charcoal hover:underline"
            >
              <Heart className="h-3 w-3" />
              Save for later
            </button>
            <button
              type="button"
              onClick={() => removeLine(line.lineId)}
              className="focus-ring underline-offset-2 hover:text-charcoal hover:underline"
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}
