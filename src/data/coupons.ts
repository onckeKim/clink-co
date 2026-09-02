export interface Coupon {
  code: string;
  description: string;
  /** Percentage (0-100) or a flat Rand amount, per `discountType`. Set to 0 for a coupon that only grants free delivery. */
  discountType: "percentage" | "fixed";
  discountValue: number;
  /** Waives the delivery fee regardless of `discountType`/`discountValue`. */
  freeDelivery: boolean;
  /** Cart subtotal (pre-discount) required for the coupon to apply. */
  minSpend?: number;
  /** ISO date strings — inclusive. Omit either for an open-ended start/end. */
  startsAt?: string;
  endsAt?: string;
  /** Restricts the discount portion to matching line items (by product slug or collection). Delivery/free-delivery still applies cart-wide. Omit both for a cart-wide discount. */
  productSlugs?: string[];
  collectionSlugs?: string[];
  /** Total redemptions allowed across all customers — a real backend would enforce this transactionally at order creation; here it's tracked in this seed array. */
  usageLimit?: number;
  timesUsed: number;
  active: boolean;
}

/**
 * Temporary seed data mirroring what a `coupons` table would hold. See
 * `src/lib/promotions.ts` for the validation/application engine, and the
 * README's checkout write-up for how usage counters would move to a real
 * transactional increment once Supabase is wired up.
 */
export const coupons: Coupon[] = [
  {
    code: "WELCOME10",
    description: "10% off your first order",
    discountType: "percentage",
    discountValue: 10,
    freeDelivery: false,
    usageLimit: 1000,
    timesUsed: 214,
    active: true,
  },
  {
    code: "SAVE100",
    description: "R100 off orders over R1,000",
    discountType: "fixed",
    discountValue: 100,
    freeDelivery: false,
    minSpend: 1000,
    timesUsed: 58,
    active: true,
  },
  {
    code: "FREESHIP",
    description: "Free delivery on orders over R500",
    discountType: "percentage",
    discountValue: 0,
    freeDelivery: true,
    minSpend: 500,
    timesUsed: 132,
    active: true,
  },
  {
    code: "HOMEBAR15",
    description: "15% off The Home Bar Edit",
    discountType: "percentage",
    discountValue: 15,
    freeDelivery: false,
    collectionSlugs: ["home-bar-edit"],
    timesUsed: 19,
    active: true,
  },
  {
    code: "HOSTESS15",
    description: "15% off Gifts Worth Giving",
    discountType: "percentage",
    discountValue: 15,
    freeDelivery: false,
    collectionSlugs: ["gifts-worth-giving"],
    timesUsed: 7,
    active: true,
  },
  {
    code: "COUPE25",
    description: "25% off Solstice Coupe Glasses",
    discountType: "percentage",
    discountValue: 25,
    freeDelivery: false,
    productSlugs: ["solstice-coupe-glasses"],
    timesUsed: 41,
    active: true,
  },
  {
    code: "ONEUSE",
    description: "Single-use launch promo (already redeemed)",
    discountType: "percentage",
    discountValue: 20,
    freeDelivery: false,
    usageLimit: 1,
    timesUsed: 1,
    active: true,
  },
  {
    code: "SUMMER24",
    description: "Summer 2024 sale (ended)",
    discountType: "percentage",
    discountValue: 20,
    freeDelivery: false,
    startsAt: "2024-11-01",
    endsAt: "2025-01-15",
    timesUsed: 302,
    active: true,
  },
  {
    code: "WINTER26",
    description: "Winter 2026 sale (not yet started)",
    discountType: "percentage",
    discountValue: 20,
    freeDelivery: false,
    startsAt: "2026-05-01",
    endsAt: "2026-08-31",
    timesUsed: 0,
    active: true,
  },
];

export function getCouponByCode(code: string) {
  return coupons.find((coupon) => coupon.code.toLowerCase() === code.trim().toLowerCase());
}
