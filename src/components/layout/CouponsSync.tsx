"use client";

import * as React from "react";
import type { Coupon } from "@/types/coupon";
import { useCartStore } from "@/store/cart-store";

/**
 * Feeds the server-fetched, currently-usable coupon list into the cart
 * store on mount. cart-store.ts's applyCoupon()/resolveCoupon() run inside
 * Zustand actions, not React components, so they can't call an async DB
 * read or a useCatalog()-style hook themselves — this is the same
 * "seed a client store from a server fetch" pattern as <AuthCartSync>,
 * just for coupons.ts's data instead of the auth session. Renders nothing.
 */
export function CouponsSync({ coupons }: { coupons: Coupon[] }) {
  const setCoupons = useCartStore((state) => state.setCoupons);

  React.useEffect(() => {
    setCoupons(coupons);
  }, [coupons, setCoupons]);

  return null;
}
