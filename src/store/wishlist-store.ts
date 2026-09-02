import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

export interface WishlistItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
}

interface WishlistState {
  items: WishlistItem[];
  toggle: (product: Product) => void;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

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
        }
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
