import { getCouponByCode, getAutomaticCoupons, recordCouponUsage, type Coupon } from "@/data/coupons";
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
 * cart — mirroring how a real promotions engine scopes discounts. Works
 * identically for a manually-entered code and for the code of an
 * automatic discount (see `getBestAutomaticDiscount`) — both are `Coupon`
 * records, just gated by `requiresCode` on the storefront.
 */
export function validateCoupon(
  code: string,
  lines: PromotableLine[],
  subtotal: number,
  now: Date = new Date(),
  /** The customer's email, when known — only passed at checkout (see /api/checkout), so a `customerEmails`-restricted coupon isn't rejected merely for being applied to an anonymous cart. */
  customerEmail?: string,
): CouponValidationResult {
  const coupon = getCouponByCode(code);
  if (!coupon) return { valid: false, error: "That coupon code isn't valid." };
  if (!coupon.active) return { valid: false, error: "That coupon is no longer active." };
  if (coupon.customerEmails?.length && customerEmail) {
    const allowed = coupon.customerEmails.some((email) => email.toLowerCase() === customerEmail.trim().toLowerCase());
    if (!allowed) return { valid: false, error: "That coupon isn't valid for this account." };
  }

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
 * Finds the best-value automatic discount (a `requiresCode: false` coupon)
 * eligible for the current cart, if any — the storefront auto-apply
 * mechanism the cart store calls whenever no manual code is applied.
 * "Best" is the largest Rand discount, with free delivery breaking a tie in
 * its favour; only one automatic discount is ever applied at a time (no
 * stacking), matching how the manual-coupon flow already works.
 */
export function getBestAutomaticDiscount(
  lines: PromotableLine[],
  subtotal: number,
  now: Date = new Date(),
): CouponValidationSuccess | null {
  let best: CouponValidationSuccess | null = null;
  for (const coupon of getAutomaticCoupons()) {
    const result = validateCoupon(coupon.code, lines, subtotal, now);
    if (!result.valid) continue;
    if (
      !best ||
      result.discountAmount > best.discountAmount ||
      (result.discountAmount === best.discountAmount && result.freeDelivery && !best.freeDelivery)
    ) {
      best = result;
    }
  }
  return best;
}

export { recordCouponUsage };
