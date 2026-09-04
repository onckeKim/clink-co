import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, ProductVariant } from "@/types/product";
import type { Coupon } from "@/types/coupon";
import { validateCoupon, getBestAutomaticDiscount, type PromotableLine } from "@/lib/promotions";
import { track } from "@/lib/analytics/track";

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
  /** "manual": the customer entered this code. "automatic": no code was entered — the promotions engine picked the best eligible automatic discount (Coupon.requiresCode === false) for the current cart. */
  source: "manual" | "automatic";
}

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  coupon: AppliedCoupon | null;
  /** The code the customer explicitly entered via applyCoupon(), independent of whatever's currently applied — kept so an automatic discount picked up after removeCoupon() never gets mistaken for a manual choice, and so a cart-content change can re-validate the customer's actual intent rather than whatever happened to be applied last. */
  manualCouponCode: string | null;
  couponError: string | null;
  /**
   * The currently-usable discount codes (src/lib/admin/coupons-store.ts's
   * getCoupons()), fed in by <CouponsSync> on mount — this is a Zustand
   * store action, not a React component, so it can't call an async DB read
   * or a useCatalog()-style hook itself. Not persisted: always starts empty
   * and gets a fresh snapshot each time the app loads, same reasoning as
   * onRehydrateStorage re-resolving below.
   */
  coupons: Coupon[];
  addItem: (product: Product, options?: { variant?: ProductVariant; quantity?: number }) => void;
  removeLine: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number, stockQuantity?: number) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  applyCoupon: (code: string) => void;
  removeCoupon: () => void;
  setCoupons: (coupons: Coupon[]) => void;
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

/**
 * Resolves what coupon/discount should be applied to the given cart
 * contents — called after every line change and after applyCoupon()/
 * removeCoupon(), so the cart never shows a discount that's no longer
 * eligible (e.g. its only matching item was removed), and always picks up
 * a newly-eligible automatic discount (e.g. the cart just crossed a
 * `minSpend` threshold). A manually-entered code, while still valid, always
 * wins over an automatic discount — the customer typed it on purpose. If it
 * stops applying, its error is still surfaced, but the best automatic
 * discount (if any) takes over underneath it rather than leaving the cart
 * with nothing.
 */
function resolveCoupon(
  lines: CartLine[],
  manualCouponCode: string | null,
  coupons: Coupon[],
): { coupon: AppliedCoupon | null; couponError: string | null } {
  const promotableLines = toPromotableLines(lines);
  const subtotal = subtotalOf(lines);

  let couponError: string | null = null;
  if (manualCouponCode) {
    const result = validateCoupon(manualCouponCode, coupons, promotableLines, subtotal);
    if (result.valid) {
      return {
        coupon: {
          code: result.coupon.code,
          discountAmount: result.discountAmount,
          freeDelivery: result.freeDelivery,
          source: "manual",
        },
        couponError: null,
      };
    }
    couponError = `"${manualCouponCode}" no longer applies: ${result.error}`;
  }

  const automaticCoupons = coupons.filter((c) => !c.requiresCode);
  const automatic = getBestAutomaticDiscount(automaticCoupons, promotableLines, subtotal);
  if (automatic) {
    return {
      coupon: {
        code: automatic.coupon.code,
        discountAmount: automatic.discountAmount,
        freeDelivery: automatic.freeDelivery,
        source: "automatic",
      },
      couponError,
    };
  }

  return { coupon: null, couponError };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      isOpen: false,
      coupon: null,
      manualCouponCode: null,
      couponError: null,
      coupons: [],

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
        set({ lines: nextLines, isOpen: true, ...resolveCoupon(nextLines, get().manualCouponCode, get().coupons) });

        const addedQuantity = Math.min(requestedQuantity, cap);
        const unitPrice = product.price + (variant?.priceDelta ?? 0);
        track({
          name: "add_to_cart",
          currency: product.currency,
          value: unitPrice * addedQuantity,
          items: [
            {
              item_id: product.id,
              item_name: product.name,
              price: unitPrice,
              quantity: addedQuantity,
              item_category: product.categorySlug,
            },
          ],
        });
      },

      removeLine: (lineId) => {
        const removed = get().lines.find((line) => line.lineId === lineId);
        const nextLines = get().lines.filter((line) => line.lineId !== lineId);
        set({ lines: nextLines, ...resolveCoupon(nextLines, get().manualCouponCode, get().coupons) });

        if (removed) {
          track({
            name: "remove_from_cart",
            currency: "ZAR",
            value: removed.price * removed.quantity,
            items: [
              {
                item_id: removed.productId,
                item_name: removed.name,
                price: removed.price,
                quantity: removed.quantity,
                item_category: removed.categorySlug,
              },
            ],
          });
        }
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
        set({ lines: nextLines, ...resolveCoupon(nextLines, get().manualCouponCode, get().coupons) });
      },

      clear: () => set({ lines: [], coupon: null, manualCouponCode: null, couponError: null }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set({ isOpen: !get().isOpen }),

      applyCoupon: (code) => {
        const result = validateCoupon(code, get().coupons, toPromotableLines(get().lines), subtotalOf(get().lines));
        if (!result.valid) {
          set({ couponError: result.error });
          return;
        }
        set({
          coupon: {
            code: result.coupon.code,
            discountAmount: result.discountAmount,
            freeDelivery: result.freeDelivery,
            source: "manual",
          },
          manualCouponCode: code,
          couponError: null,
        });
        track({ name: "coupon_applied", couponCode: result.coupon.code, discountAmount: result.discountAmount });
      },

      removeCoupon: () => {
        const nextLines = get().lines;
        set({ manualCouponCode: null, ...resolveCoupon(nextLines, null, get().coupons) });
      },

      /** Called by <CouponsSync> on mount (and whenever it refetches) with the server-fetched, currently-usable coupon list — re-resolves immediately so a coupon that loads in after the cart already rendered is picked up without waiting for the next cart mutation. */
      setCoupons: (coupons) => {
        set({ coupons, ...resolveCoupon(get().lines, get().manualCouponCode, coupons) });
      },
    }),
    {
      name: "clink-co-cart",
      partialize: (state) => ({ lines: state.lines, coupon: state.coupon, manualCouponCode: state.manualCouponCode }),
      // A persisted cart may have been saved before today's automatic
      // discounts existed (or before a since-changed minSpend/date window),
      // so re-resolve once the persisted lines/manualCouponCode are back —
      // same reasoning as revalidating after any other cart mutation.
      // state.coupons is always [] here (not persisted, and this runs before
      // <CouponsSync>'s mount effect) — setCoupons() re-resolves again the
      // moment the real list loads.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        Object.assign(state, resolveCoupon(state.lines, state.manualCouponCode, state.coupons));
      },
    },
  ),
);

export const useCartCount = () =>
  useCartStore((state) => state.lines.reduce((sum, line) => sum + line.quantity, 0));

export const useCartSubtotal = () => useCartStore((state) => subtotalOf(state.lines));
