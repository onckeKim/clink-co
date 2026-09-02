import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@/types/product";

export interface RecentlyViewedItem {
  productId: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  rating?: number;
  reviewCount?: number;
  viewedAt: number;
}

const MAX_ITEMS = 8;

interface RecentlyViewedState {
  items: RecentlyViewedItem[];
  add: (product: Product) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      items: [],

      add: (product) => {
        const rest = get().items.filter((item) => item.productId !== product.id);
        const entry: RecentlyViewedItem = {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          shortDescription: product.shortDescription,
          image: product.images[0],
          price: product.price,
          compareAtPrice: product.compareAtPrice,
          rating: product.rating,
          reviewCount: product.reviewCount,
          viewedAt: Date.now(),
        };
        set({ items: [entry, ...rest].slice(0, MAX_ITEMS) });
      },

      clear: () => set({ items: [] }),
    }),
    {
      name: "clink-co-recently-viewed",
    },
  ),
);
