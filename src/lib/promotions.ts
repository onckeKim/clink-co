import { coupons, getCouponByCode, type Coupon } from "@/data/coupons";
import { formatPrice } from "@/lib/utils";

/** The minimal shape the promotions engine needs from a cart line — decoupled from the cart store so this stays a pure, independently testable module. */
export interface PromotableLine {
  slug: string;
  categorySlug?: string;
  collectionSlugs?: string[];
  /** price * quantity for this line. */
  lineTotal: number;
}

export interface CouponValidationSuccess {
  valid: true;
  coupon: Coupon;
  /** Rand amount to subtract from the cart subtotal. */
  discountAmount: number;
  freeDelivery: boolean;
}

export interface CouponValidationFailure {
  valid: false;
  error: string;
}

export type CouponValidationResult = CouponValidationSuccess | CouponValidationFailure;

function isScoped(coupon: Coupon): boolean {
  return Boolean(coupon.productSlugs?.length || coupon.collectionSlugs?.length);
}

function matchesScope(line: PromotableLine, coupon: Coupon): boolean {
  if (!isScoped(coupon)) return true;
  if (coupon.productSlugs?.includes(line.slug)) return true;
  if (line.collectionSlugs?.some((slug) => coupon.collectionSlugs?.includes(slug))) return true;
  return false;
}

/**
 * Validates a coupon code against the current cart and, if valid, computes
 * the discount it grants. Product-/collection-specific coupons only
 * discount the matching line items' share of the subtotal — not the whole
 * cart — mirroring how a real promotions engine scopes discounts.
 */
export function validateCoupon(
  code: string,
  lines: PromotableLine[],
  subtotal: number,
  now: Date = new Date(),
): CouponValidationResult {
  const coupon = getCouponByCode(code);
  if (!coupon) return { valid: false, error: "That coupon code isn't valid." };
  if (!coupon.active) return { valid: false, error: "That coupon is no longer active." };

  if (coupon.startsAt && now < new Date(`${coupon.startsAt}T00:00:00`)) {
    return { valid: false, error: "That coupon isn't active yet." };
  }
  if (coupon.endsAt && now > new Date(`${coupon.endsAt}T23:59:59`)) {
    return { valid: false, error: "That coupon has expired." };
  }
  if (coupon.usageLimit !== undefined && coupon.timesUsed >= coupon.usageLimit) {
    return { valid: false, error: "That coupon has reached its usage limit." };
  }
  if (coupon.minSpend !== undefined && subtotal < coupon.minSpend) {
    return { valid: false, error: `Spend at least ${formatPrice(coupon.minSpend)} to use this coupon.` };
  }

  const eligibleLines = lines.filter((line) => matchesScope(line, coupon));
  const eligibleTotal = eligibleLines.reduce((sum, line) => sum + line.lineTotal, 0);

  if (isScoped(coupon) && eligibleTotal === 0) {
    return { valid: false, error: "That coupon doesn't apply to anything in your cart." };
  }

  const discountAmount =
    coupon.discountType === "percentage"
      ? Math.round(eligibleTotal * (coupon.discountValue / 100))
      : Math.min(coupon.discountValue, eligibleTotal);

  return { valid: true, coupon, discountAmount, freeDelivery: coupon.freeDelivery };
}

/**
 * Increments the seed coupon's usage counter — a stand-in for a real
 * transactional `UPDATE coupons SET times_used = times_used + 1 WHERE ...`
 * run inside the order-creation transaction. Mutating this in-memory array
 * is a development substitute only: it resets on server restart and isn't
 * safe across multiple server instances — see the orders store for the
 * same caveat applied to orders themselves.
 */
export function recordCouponUsage(code: string): void {
  const coupon = getCouponByCode(code);
  if (coupon) coupon.timesUsed += 1;
}

export { coupons };
