export interface Coupon {
  id: string;
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
  /** Restricts this coupon to specific customers by email (case-insensitive). Checked at checkout, where the customer's email is known — not while it's merely applied to a cart, since a guest cart may not have one yet. Omit for no customer restriction. */
  customerEmails?: string[];
  /** Total redemptions allowed across all customers — a real backend would enforce this transactionally at order creation; here it's tracked in the coupons store. */
  usageLimit?: number;
  timesUsed: number;
  active: boolean;
  /** true (default): a customer must enter `code` at checkout. false: an "automatic discount" — silently applied to any eligible cart with no code entry, and never shown as a redeemable code on the storefront. */
  requiresCode: boolean;
}
