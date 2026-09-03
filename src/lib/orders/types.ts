import type { SouthAfricanProvince } from "@/data/provinces";
import type { DeliveryMethodId } from "@/config/delivery";

export type OrderStatus = "pending_payment" | "paid" | "payment_failed" | "cancelled" | "fulfilled";

export type PaymentMethodId = "test" | "payfast" | "peach" | "yoco" | "ozow" | "eft";

export interface OrderLineItem {
  productId: string;
  slug: string;
  sku: string;
  name: string;
  image: string;
  variantLabel?: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderAddress {
  fullName: string;
  line1: string;
  line2?: string;
  suburb: string;
  city: string;
  province: SouthAfricanProvince;
  postalCode: string;
  phone: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  /** The client-generated key that made this order's creation idempotent — see src/lib/orders/store.ts. */
  idempotencyKey: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;

  customerEmail: string;
  customerName: string;
  isGuest: boolean;
  /** Populated once real account checkout exists (Supabase Auth) — see the README's checkout write-up. */
  userId?: string;

  lines: OrderLineItem[];
  couponCode?: string;

  deliveryAddress: OrderAddress;
  billingAddress: OrderAddress;
  deliveryMethodId: DeliveryMethodId;
  deliveryLabel: string;
  estimatedDeliveryEarliest: string;
  estimatedDeliveryLatest: string;

  shippingNotes?: string;
  giftMessage?: string;
  marketingConsent: boolean;

  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  taxAmount: number;
  total: number;

  paymentMethod: PaymentMethodId;
  paymentReference?: string;
  paymentRedirectUrl?: string;

  /** Set from /admin/orders once a courier handoff exists — undefined until the admin adds tracking. See the account order-detail view for the honest empty state this produces until then. */
  trackingCarrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;

  /** Set by an admin cancelling the order from /admin/orders — distinct from a payment-provider-initiated `payment_failed`. */
  cancelledReason?: string;
  /** Set by an admin recording a refund from /admin/orders. A refund doesn't itself change `status` — the admin still decides separately whether the order should also move to `cancelled`. */
  refundAmount?: number;
  refundReason?: string;
  refundedAt?: string;
}
