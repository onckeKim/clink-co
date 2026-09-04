"use client";

import * as React from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore, type CartLine } from "@/store/cart-store";
import { useWishlistStore, type WishlistItem } from "@/store/wishlist-store";
import { mergeCartLines, mergeWishlistItems } from "@/lib/merge";

const SYNC_DEBOUNCE_MS = 500;

async function fetchAccountCart(): Promise<CartLine[]> {
  try {
    const res = await fetch("/api/account/cart");
    if (!res.ok) return [];
    const data = (await res.json()) as { lines?: CartLine[] };
    return data.lines ?? [];
  } catch {
    return [];
  }
}

async function fetchAccountWishlist(): Promise<WishlistItem[]> {
  try {
    const res = await fetch("/api/account/wishlist");
    if (!res.ok) return [];
    const data = (await res.json()) as { items?: WishlistItem[] };
    return data.items ?? [];
  } catch {
    return [];
  }
}

/** Fire-and-forget — best-effort background persistence, not the checkout-critical path (see lib/cart-validation.ts for that). */
function pushCartToAccount(lines: CartLine[]) {
  void fetch("/api/account/cart", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lines: lines.map((line) => ({ productId: line.productId, variantId: line.variant?.id, quantity: line.quantity })),
    }),
  }).catch(() => {});
}

function pushWishlistToAccount(items: WishlistItem[]) {
  void fetch("/api/account/wishlist", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds: items.map((item) => item.productId) }),
  }).catch(() => {});
}

/**
 * Keeps the signed-in account's saved cart/wishlist (Supabase carts/
 * cart_items, wishlists/wishlist_items) in sync with cart-store.ts/
 * wishlist-store.ts, which stay the source of truth in the browser at all
 * times — this hook only mirrors their state to the account, never the
 * other way around except at the one moment sign-in happens:
 *
 *  - On sign-in — either a fresh SIGNED_IN transition, or discovering an
 *    already-active session on mount (e.g. a returning visit on a new
 *    device) — fetches the account's saved cart/wishlist and merges it
 *    with whatever's currently in the browser (see lib/merge.ts), so nothing
 *    on either side is lost. Flipping each store's `userId` before writing
 *    the merged state back means that write reaches the account through
 *    the exact same path as any later change, rather than a special-cased
 *    "persist the merge" call.
 *  - For as long as the account stays signed in, every further cart/
 *    wishlist change is pushed to the account in the background (debounced,
 *    so a burst of quantity clicks doesn't fire a request per click).
 *  - On sign-out, syncing just stops — the local cart/wishlist (now
 *    holding the merged contents) stays in the browser like any guest
 *    cart would; nothing is cleared.
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

    let syncedUserId: string | null = null;

    const syncOnSignIn = async (userId: string) => {
      if (syncedUserId === userId) return;
      syncedUserId = userId;

      const [accountLines, accountWishlist] = await Promise.all([fetchAccountCart(), fetchAccountWishlist()]);
      const mergedLines = mergeCartLines(accountLines, useCartStore.getState().lines);
      const mergedWishlist = mergeWishlistItems(accountWishlist, useWishlistStore.getState().items);

      useCartStore.getState().setUserId(userId);
      useWishlistStore.getState().setUserId(userId);
      useCartStore.setState({ lines: mergedLines });
      useWishlistStore.setState({ items: mergedWishlist });
    };

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) void syncOnSignIn(data.user.id);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void syncOnSignIn(session.user.id);
      } else if (event === "SIGNED_OUT") {
        syncedUserId = null;
        useCartStore.getState().setUserId(null);
        useWishlistStore.getState().setUserId(null);
      }
    });

    let cartTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribeCart = useCartStore.subscribe((state, prevState) => {
      if (!state.userId || state.lines === prevState.lines) return;
      clearTimeout(cartTimer);
      cartTimer = setTimeout(() => pushCartToAccount(state.lines), SYNC_DEBOUNCE_MS);
    });

    let wishlistTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribeWishlist = useWishlistStore.subscribe((state, prevState) => {
      if (!state.userId || state.items === prevState.items) return;
      clearTimeout(wishlistTimer);
      wishlistTimer = setTimeout(() => pushWishlistToAccount(state.items), SYNC_DEBOUNCE_MS);
    });

    return () => {
      subscription.subscription.unsubscribe();
      unsubscribeCart();
      unsubscribeWishlist();
      clearTimeout(cartTimer);
      clearTimeout(wishlistTimer);
    };
  }, []);
}
