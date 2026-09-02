"use client";

import * as React from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import type { Product, ProductVariant } from "@/types/product";
import { Button } from "@/components/ui/Button";
import { useCartStore } from "@/store/cart-store";
import { formatPrice } from "@/lib/utils";

/**
 * Mobile-only bar that appears once `anchorRef` (the main purchase panel's
 * add-to-cart button) has scrolled out of view above the viewport, via an
 * IntersectionObserver — and disappears again once it's back in view.
 */
export function StickyAddToCart({
  anchorRef,
  product,
  variant,
  quantity,
  price,
}: {
  anchorRef: React.RefObject<HTMLElement | null>;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  price: number;
}) {
  const [visible, setVisible] = React.useState(false);
  const addItem = useCartStore((state) => state.addItem);

  React.useEffect(() => {
    const el = anchorRef.current;
    if (!el || product.discontinued) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show only once the anchor has fully scrolled above the viewport
        // (its bottom edge, not just its top, has passed y=0) — not when
        // it simply hasn't scrolled into view yet on initial load (which
        // is also a non-intersecting state, but below the viewport).
        setVisible(!entry.isIntersecting && entry.boundingClientRect.bottom < 0);
      },
      { threshold: 0 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [anchorRef, product.discontinued]);

  if (product.discontinued) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-sand bg-warm-white px-4 py-3 shadow-lifted sm:hidden"
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-sand/40">
            <Image src={product.images[0]} alt="" fill sizes="44px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-charcoal">{product.name}</p>
            <p className="text-xs text-stone">{formatPrice(price)}</p>
          </div>
          <Button
            type="button"
            disabled={!product.inStock}
            onClick={() => addItem(product, { variant, quantity })}
            className="shrink-0"
          >
            <ShoppingBag className="h-4 w-4" />
            {product.inStock ? "Add" : "Notify me"}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
