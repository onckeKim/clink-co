import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";
import { track } from "@/lib/analytics/track";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
}

interface WishlistState {
  items: WishlistItem[];
  /** The signed-in account's id, set by <AuthCartSync> — see cart-store.ts's identical field for why this store doesn't make network calls itself. */
  userId: string | null;
  setUserId: (userId: string | null) => void;
  toggle: (product: Product) => void;
  /** Adds a pre-built item directly — used when moving a cart line to the wishlist, where only denormalized cart data (not a full Product) is on hand. No-ops if already present. */
  add: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      userId: null,
      setUserId: (userId) => set({ userId }),

      toggle: (product) => {
        const exists = get().items.some((item) => item.productId === product.id);
        if (exists) {
          set({ items: get().items.filter((item) => item.productId !== product.id) });
        } else {
          set({
            items: [
              ...get().items,
              {
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0],
                price: product.price,
              },
            ],
          });
          track({
            name: "add_to_wishlist",
            currency: product.currency,
            value: product.price,
            items: [{ item_id: product.id, item_name: product.name, price: product.price, item_category: product.categorySlug }],
          });
        }
      },

      add: (item) => {
        if (get().items.some((existing) => existing.productId === item.productId)) return;
        set({ items: [...get().items, item] });
      },

      remove: (productId) =>
        set({ items: get().items.filter((item) => item.productId !== productId) }),

      has: (productId) => get().items.some((item) => item.productId === productId),

      clear: () => set({ items: [] }),
    }),
    {
      name: "clink-co-wishlist",
    },
  ),
);

export const useWishlistCount = () => useWishlistStore((state) => state.items.length);
