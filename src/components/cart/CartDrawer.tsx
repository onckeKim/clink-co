"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCartStore, useCartSubtotal } from "@/store/cart-store";
import { buttonVariants } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";
import { useMounted } from "@/lib/hooks/use-mounted";

export function CartDrawer() {
  const mounted = useMounted();
  const { isOpen, close, lines, updateQuantity, removeLine } = useCartStore();
  const subtotal = useCartSubtotal();

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
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
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
            className="relative flex h-full w-full max-w-md flex-col bg-ivory shadow-lifted"
          >
            <div className="flex items-center justify-between border-b border-sand px-6 py-5">
              <h2 className="font-display text-xl text-ink">Your bag</h2>
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
                <ShoppingBag className="h-8 w-8 text-clay" />
                <p className="text-sm text-clay">
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
                    <li key={line.lineId} className="flex gap-4 py-5">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-sand/50">
                        <Image
                          src={line.image}
                          alt={line.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-ink">{line.name}</p>
                            {line.variant && (
                              <p className="text-xs text-clay">{line.variant.label}</p>
                            )}
                          </div>
                          <p className="text-sm font-medium text-ink">
                            {formatPrice(line.price * line.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 rounded-full border border-sand px-2 py-1">
                            <button
                              type="button"
                              aria-label="Decrease quantity"
                              onClick={() => updateQuantity(line.lineId, line.quantity - 1)}
                              className="focus-ring flex h-6 w-6 items-center justify-center rounded-full hover:bg-sand"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-4 text-center text-xs">{line.quantity}</span>
                            <button
                              type="button"
                              aria-label="Increase quantity"
                              onClick={() => updateQuantity(line.lineId, line.quantity + 1)}
                              className="focus-ring flex h-6 w-6 items-center justify-center rounded-full hover:bg-sand"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.lineId)}
                            className="focus-ring text-xs text-clay underline-offset-2 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-sand px-6 py-6">
                  <div className="mb-4 flex items-center justify-between text-sm">
                    <span className="text-clay">Subtotal</span>
                    <span className="font-medium text-ink">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="mb-4 text-xs text-clay">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className={cn(buttonVariants({ size: "lg" }), "w-full")}
                  >
                    Checkout
                  </Link>
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
