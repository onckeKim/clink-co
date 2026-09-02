"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore, type CartLine } from "@/store/cart-store";
import { useWishlistStore, type WishlistItem } from "@/store/wishlist-store";
import { mergeCartLines, mergeWishlistItems } from "@/lib/merge";

/**
 * Listens for Supabase auth state changes and merges the guest cart/
 * wishlist into the account's saved versions on sign-in. This is real,
 * mountable code — but since no sign-in UI exists yet (see the README's
 * roadmap: account pages are a future phase), `onAuthStateChange` never
 * actually fires a SIGNED_IN event in this build, so the merge path is
 * wired but currently untested end-to-end. `fetchAccountCart`/
 * `fetchAccountWishlist` are the two calls that need real
 * `cart_items`/`wishlist_items` Supabase tables to do anything meaningful;
 * they're stubbed to return empty arrays until then.
 */
export function useAuthCartSync() {
  React.useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      // Supabase env vars aren't set in this environment — nothing to sync.
      return;
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event !== "SIGNED_IN") return;

      // TODO once a `cart_items` table exists: replace with a real fetch.
      const accountLines: CartLine[] = [];
      const accountWishlist: WishlistItem[] = [];

      const guestLines = useCartStore.getState().lines;
      const guestWishlist = useWishlistStore.getState().items;

      useCartStore.setState({ lines: mergeCartLines(accountLines, guestLines) });
      useWishlistStore.setState({ items: mergeWishlistItems(accountWishlist, guestWishlist) });

      // TODO once tables exist: persist the merged result back to the account.
    });

    return () => subscription.subscription.unsubscribe();
  }, []);
}
