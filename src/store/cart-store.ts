import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, ProductVariant } from "@/types/product";

export interface CartLine {
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  variant?: Pick<ProductVariant, "id" | "label">;
  quantity: number;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  addItem: (product: Product, options?: { variant?: ProductVariant; quantity?: number }) => void;
  removeLine: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const lineKey = (productId: string, variantId?: string) =>
  variantId ? `${productId}::${variantId}` : productId;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,

      addItem: (product, options) => {
        const quantity = options?.quantity ?? 1;
        const variant = options?.variant;
        const lineId = lineKey(product.id, variant?.id);
        const existing = get().lines.find((line) => line.lineId === lineId);

        if (existing) {
          set({
            lines: get().lines.map((line) =>
              line.lineId === lineId
                ? { ...line, quantity: line.quantity + quantity }
                : line,
            ),
          });
        } else {
          set({
            lines: [
              ...get().lines,
              {
                lineId,
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0],
                price: product.price + (variant?.priceDelta ?? 0),
                variant: variant ? { id: variant.id, label: variant.label } : undefined,
                quantity,
              },
            ],
          });
        }
        set({ isOpen: true });
      },

      removeLine: (lineId) =>
        set({ lines: get().lines.filter((line) => line.lineId !== lineId) }),

      updateQuantity: (lineId, quantity) => {
        if (quantity <= 0) {
          get().removeLine(lineId);
          return;
        }
        set({
          lines: get().lines.map((line) =>
            line.lineId === lineId ? { ...line, quantity } : line,
          ),
        });
      },

      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),
    }),
    {
      name: "clink-co-cart",
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export const useCartCount = () =>
  useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));

export const useCartSubtotal = () =>
  useCartStore((state) =>
    state.lines.reduce((sum, line) => sum + line.price * line.quantity, 0),
  );
