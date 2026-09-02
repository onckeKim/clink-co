import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, ProductVariant } from "@/types/product";
import { validateCoupon, type PromotableLine } from "@/lib/promotions";

export interface CartLine {
  lineId: string;
  productId: string;
  slug: string;
  sku: string;
  name: string;
  image: string;
  price: number;
  variant?: Pick<ProductVariant, "id" | "label">;
  quantity: number;
  /** Denormalized for the promotions engine (product-/collection-specific coupons) — see src/lib/promotions.ts. */
  categorySlug: string;
  collectionSlugs: string[];
}

interface AppliedCoupon {
  code: string;
  discountAmount: number;
  freeDelivery: boolean;
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  coupon: AppliedCoupon | null;
  couponError: string | null;
  addItem: (product: Product, options?: { variant?: ProductVariant; quantity?: number }) => void;
  removeLine: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number, stockQuantity?: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
}

const lineKey = (productId: string, variantId?: string) =>
  variantId ? `${productId}::${variantId}` : productId;

function toPromotableLines(lines: CartLine[]): PromotableLine[] {
  return lines.map((line) => ({
    slug: line.slug,
    categorySlug: line.categorySlug,
    collectionSlugs: line.collectionSlugs,
    lineTotal: line.price * line.quantity,
  }));
}

function subtotalOf(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
}

/** Re-runs the currently applied coupon against the latest cart contents — called after any line change so a coupon that's no longer eligible (e.g. its only matching item was removed) is dropped rather than silently kept. */
function revalidateCoupon(lines: CartLine[], coupon: AppliedCoupon | null): { coupon: AppliedCoupon | null; couponError: string | null } {
  if (!coupon) return { coupon: null, couponError: null };
  const result = validateCoupon(coupon.code, toPromotableLines(lines), subtotalOf(lines));
  if (!result.valid) {
    return { coupon: null, couponError: `"${coupon.code}" no longer applies: ${result.error}` };
  }
  return {
    coupon: { code: coupon.code, discountAmount: result.discountAmount, freeDelivery: result.freeDelivery },
    couponError: null,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      coupon: null,
      couponError: null,

      addItem: (product, options) => {
        const requestedQuantity = options?.quantity ?? 1;
        const variant = options?.variant;
        const lineId = lineKey(product.id, variant?.id);
        const existing = get().lines.find((line) => line.lineId === lineId);
        const cap = product.stockQuantity;

        let nextLines: CartLine[];
        if (existing) {
          const quantity = Math.min(existing.quantity + requestedQuantity, cap);
          nextLines = get().lines.map((line) => (line.lineId === lineId ? { ...line, quantity } : line));
        } else {
          nextLines = [
            ...get().lines,
            {
              lineId,
              productId: product.id,
              slug: product.slug,
              sku: product.sku,
              name: product.name,
              image: product.images[0],
              price: product.price + (variant?.priceDelta ?? 0),
              variant: variant ? { id: variant.id, label: variant.label } : undefined,
              quantity: Math.min(requestedQuantity, cap),
              categorySlug: product.categorySlug,
              collectionSlugs: product.collectionSlugs,
            },
          ];
        }
        set({ lines: nextLines, isOpen: true, ...revalidateCoupon(nextLines, get().coupon) });
      },

      removeLine: (lineId) => {
        const nextLines = get().lines.filter((line) => line.lineId !== lineId);
        set({ lines: nextLines, ...revalidateCoupon(nextLines, get().coupon) });
      },

      updateQuantity: (lineId, quantity, stockQuantity) => {
        if (quantity <= 0) {
          get().removeLine(lineId);
          return;
        }
        const capped = stockQuantity !== undefined ? Math.min(quantity, stockQuantity) : quantity;
        const nextLines = get().lines.map((line) =>
          line.lineId === lineId ? { ...line, quantity: capped } : line,
        );
        set({ lines: nextLines, ...revalidateCoupon(nextLines, get().coupon) });
      },

      clear: () => set({ lines: [], coupon: null, couponError: null }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),

      applyCoupon: (code) => {
        const result = validateCoupon(code, toPromotableLines(get().lines), subtotalOf(get().lines));
        if (!result.valid) {
          set({ couponError: result.error });
          return;
        }
        set({
          coupon: { code: result.coupon.code, discountAmount: result.discountAmount, freeDelivery: result.freeDelivery },
          couponError: null,
        });
      },

      removeCoupon: () => set({ coupon: null, couponError: null }),
    }),
    {
      name: "clink-co-cart",
      partialize: (state) => ({ lines: state.lines, coupon: state.coupon }),
    },
  ),
);

export const useCartCount = () =>
  useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));

export const useCartSubtotal = () => useCartStore((state) => subtotalOf(state.lines));
