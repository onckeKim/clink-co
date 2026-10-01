"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/store/cart-store";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks/use-mounted";

export function CartDrawer() {
  const mounted = useMounted();
  const { isOpen, close, lines } = useCartStore();

  React.useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
            onClick={close}
            aria-hidden
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Shopping bag"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex h-full w-full max-w-md flex-col bg-warm-white shadow-lifted"
          >
            <div className="flex items-center justify-between border-b border-sand px-6 py-5">
              <h2 className="font-display text-xl text-charcoal">Your bag</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Close bag"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-sand"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
                <ShoppingBag className="h-8 w-8 text-stone" />
                <p className="text-sm text-stone">
                  Your bag is empty — for now. Browse the shop to find something worth raising a
                  glass to.
                </p>
                <Link
                  href="/shop"
                  onClick={close}
                  className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}
                >
                  Continue shopping
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 divide-y divide-sand overflow-y-auto px-6">
                  {lines.map((line) => (
                    <CartLineItem key={line.lineId} line={line} compact />
                  ))}
                </ul>

                <div className="flex flex-col gap-4 border-t border-sand px-6 py-6">
                  <CartSummary compact />
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/checkout"
                      onClick={close}
                      className={cn(buttonVariants({ size: "lg" }), "w-full")}
                    >
                      Checkout
                    </Link>
                    <Link
                      href="/cart"
                      onClick={close}
                      className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-full")}
                    >
                      View full bag
                    </Link>
                  </div>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
