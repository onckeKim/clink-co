/**
 * Thin re-export of the storefront-facing coupon reads — the actual data
 * lives in the `discount_codes` table (src/lib/admin/coupons-store.ts,
 * src/lib/db/discounts.ts). See src/lib/promotions.ts for the
 * validation/application engine that consumes these, and the README's
 * admin section for how admin edits reach the storefront without a
 * redeploy.
 */
export {
  getCoupons,
  getCouponByCode,
  getAutomaticCoupons,
} from "@/lib/admin/coupons-store";
export type { Coupon } from "@/types/coupon";
