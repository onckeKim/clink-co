/**
 * Thin re-export of the storefront-facing coupon reads — the actual data
 * now lives in the mutable coupons store (src/lib/admin/coupons-store.ts),
 * seeded once from src/data/coupons-seed.ts. See src/lib/promotions.ts for
 * the validation/application engine that consumes these, and the README's
 * admin section for how admin edits reach the storefront without a
 * redeploy.
 */
export {
  getCoupons,
  getCouponByCode,
  getAutomaticCoupons,
  recordCouponUsage,
} from "@/lib/admin/coupons-store";
export type { Coupon } from "@/types/coupon";
