import "server-only";
import type { Order } from "@/lib/orders/types";
import type { EmailCategory, EmailContent } from "../types";
import { welcomeEmailTemplate, emailVerificationTemplate, passwordResetTemplate } from "./customer-account";
import {
  orderConfirmationTemplate,
  paymentReceivedTemplate,
  paymentFailedTemplate,
  orderProcessingTemplate,
  orderPackedTemplate,
  orderShippedTemplate,
  deliveryConfirmationTemplate,
  orderCancelledTemplate,
  refundProcessedTemplate,
} from "./customer-orders";
import { returnRequestReceivedTemplate, returnApprovedTemplate, returnRejectedTemplate } from "./customer-returns";
import { backInStockTemplate, wishlistReminderTemplate, abandonedCartReminderTemplate, reviewRequestTemplate } from "./customer-engagement";
import {
  newOrderAdminTemplate,
  paymentFailureAdminTemplate,
  lowStockAdminTemplate,
  outOfStockAdminTemplate,
  returnRequestAdminTemplate,
  contactFormAdminTemplate,
  newReviewAdminTemplate,
} from "./admin";

/** Sample data for previews only — every field here is fictional, matching the "no real customer personal information" rule this app applies everywhere else (see supabase/seed.sql). */
function sampleOrder(overrides: Partial<Order> = {}): Order {
  const address = {
    fullName: "Jane Sithole",
    line1: "12 Kloof Street",
    line2: "Apt 4B",
    suburb: "Gardens",
    city: "Cape Town",
    province: "Western Cape" as const,
    postalCode: "8001",
    phone: "+27 82 555 0134",
  };
  const lines = [
    { productId: "prod-1", slug: "solstice-coupe-glasses", sku: "CC-GLS-001", name: "Solstice Coupe Glasses", image: "/images/products/solstice-coupe-glasses-1.svg", variantLabel: "Set of 4", unitPrice: 1450, quantity: 1, lineTotal: 1450 },
    { productId: "prod-2", slug: "harbor-rocks-glasses", sku: "CC-GLS-002", name: "Harbor Rocks Glasses", image: "/images/products/harbor-rocks-glasses-1.svg", unitPrice: 1250, quantity: 1, lineTotal: 1250 },
  ];
  return {
    id: "order-preview",
    orderNumber: "CC-250304-0001",
    idempotencyKey: "preview",
    status: "paid",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerEmail: "jane@example.com",
    customerName: "Jane Sithole",
    isGuest: false,
    lines,
    deliveryAddress: address,
    billingAddress: address,
    deliveryMethodId: "standard",
    deliveryLabel: "Standard Delivery",
    estimatedDeliveryEarliest: new Date(Date.now() + 2 * 86400000).toISOString(),
    estimatedDeliveryLatest: new Date(Date.now() + 5 * 86400000).toISOString(),
    marketingConsent: true,
    subtotal: 2700,
    discountAmount: 0,
    deliveryFee: 95,
    taxAmount: 365,
    total: 2795,
    paymentMethod: "payfast",
    paymentReference: "PF-8842291",
    ...overrides,
  };
}

const sampleProduct = { name: "Aldine Decanter", image: "/images/products/aldine-decanter-1.svg", price: 2650, slug: "aldine-decanter" };
const sampleUnsubscribeUrl = "https://clinkandco.com/unsubscribe?token=preview-token";

export interface TemplateRegistryEntry {
  key: string;
  label: string;
  audience: "customer" | "admin";
  emailCategory: EmailCategory;
  render: () => EmailContent;
}

export const templateRegistry: TemplateRegistryEntry[] = [
  // Customer — account
  { key: "welcome", label: "Welcome", audience: "customer", emailCategory: "transactional", render: () => welcomeEmailTemplate({ firstName: "Jane" }) },
  {
    key: "email-verification",
    label: "Email Verification",
    audience: "customer",
    emailCategory: "transactional",
    render: () => emailVerificationTemplate({ firstName: "Jane", verifyUrl: "https://clinkandco.com/auth/confirm?token=preview", expiresInHours: 24 }),
  },
  {
    key: "password-reset",
    label: "Password Reset",
    audience: "customer",
    emailCategory: "transactional",
    render: () => passwordResetTemplate({ firstName: "Jane", resetUrl: "https://clinkandco.com/reset-password?token=preview", expiresInMinutes: 60 }),
  },
  // Customer — order lifecycle
  { key: "order-confirmation", label: "Order Confirmation", audience: "customer", emailCategory: "transactional", render: () => orderConfirmationTemplate(sampleOrder({ paymentMethod: "eft" })) },
  { key: "payment-received", label: "Payment Received", audience: "customer", emailCategory: "transactional", render: () => paymentReceivedTemplate(sampleOrder()) },
  { key: "payment-failed", label: "Payment Failed", audience: "customer", emailCategory: "transactional", render: () => paymentFailedTemplate(sampleOrder({ status: "payment_failed" })) },
  { key: "order-processing", label: "Order Processing", audience: "customer", emailCategory: "transactional", render: () => orderProcessingTemplate(sampleOrder()) },
  { key: "order-packed", label: "Order Packed", audience: "customer", emailCategory: "transactional", render: () => orderPackedTemplate(sampleOrder()) },
  {
    key: "order-shipped",
    label: "Order Shipped",
    audience: "customer",
    emailCategory: "transactional",
    render: () => orderShippedTemplate(sampleOrder({ trackingCarrier: "Courier Guy", trackingNumber: "CG192837465", trackingUrl: "https://example.com/track/CG192837465" })),
  },
  { key: "delivery-confirmation", label: "Delivery Confirmation", audience: "customer", emailCategory: "transactional", render: () => deliveryConfirmationTemplate(sampleOrder({ status: "fulfilled" })) },
  {
    key: "order-cancelled",
    label: "Order Cancelled",
    audience: "customer",
    emailCategory: "transactional",
    render: () => orderCancelledTemplate(sampleOrder({ status: "cancelled", cancelledReason: "Requested by customer" })),
  },
  {
    key: "refund-processed",
    label: "Refund Processed",
    audience: "customer",
    emailCategory: "transactional",
    render: () => refundProcessedTemplate(sampleOrder({ refundAmount: 2795, refundReason: "Order cancelled", refundedAt: new Date().toISOString() })),
  },
  // Customer — returns
  { key: "return-request-received", label: "Return Request Received", audience: "customer", emailCategory: "transactional", render: () => returnRequestReceivedTemplate(sampleOrder(), "changed-mind", "Doesn't suit our kitchen after all.") },
  { key: "return-approved", label: "Return Approved", audience: "customer", emailCategory: "transactional", render: () => returnApprovedTemplate(sampleOrder()) },
  { key: "return-rejected", label: "Return Rejected", audience: "customer", emailCategory: "transactional", render: () => returnRejectedTemplate(sampleOrder(), "Outside the 30-day return window.") },
  // Customer — engagement
  { key: "back-in-stock", label: "Back in Stock", audience: "customer", emailCategory: "marketing", render: () => backInStockTemplate({ firstName: "Jane", product: sampleProduct, unsubscribeUrl: sampleUnsubscribeUrl }) },
  {
    key: "wishlist-reminder",
    label: "Wishlist Reminder",
    audience: "customer",
    emailCategory: "marketing",
    render: () => wishlistReminderTemplate({ firstName: "Jane", products: [sampleProduct, { name: "Toast Champagne Flutes", image: "/images/products/toast-champagne-flutes-1.svg", price: 1380, slug: "toast-champagne-flutes" }], unsubscribeUrl: sampleUnsubscribeUrl }),
  },
  {
    key: "abandoned-cart",
    label: "Abandoned Cart Reminder",
    audience: "customer",
    emailCategory: "marketing",
    render: () => abandonedCartReminderTemplate({ firstName: "Jane", products: [sampleProduct], cartTotal: 2650, unsubscribeUrl: sampleUnsubscribeUrl }),
  },
  { key: "review-request", label: "Review Request", audience: "customer", emailCategory: "transactional", render: () => reviewRequestTemplate(sampleOrder({ status: "fulfilled" })) },
  // Admin
  { key: "admin-new-order", label: "New Order (Admin)", audience: "admin", emailCategory: "transactional", render: () => newOrderAdminTemplate(sampleOrder()) },
  { key: "admin-payment-failure", label: "Payment Failure (Admin)", audience: "admin", emailCategory: "transactional", render: () => paymentFailureAdminTemplate(sampleOrder({ status: "payment_failed" })) },
  {
    key: "admin-low-stock",
    label: "Low Stock Warning (Admin)",
    audience: "admin",
    emailCategory: "transactional",
    render: () => lowStockAdminTemplate({ id: "prod-1", name: "Solstice Coupe Glasses", sku: "CC-GLS-001", stockQuantity: 3, lowStockThreshold: 5 }),
  },
  {
    key: "admin-out-of-stock",
    label: "Out of Stock Warning (Admin)",
    audience: "admin",
    emailCategory: "transactional",
    render: () => outOfStockAdminTemplate({ id: "prod-1", name: "Willow Champagne Bucket", sku: "CC-SRV-004" }),
  },
  {
    key: "admin-return-request",
    label: "Return Request (Admin)",
    audience: "admin",
    emailCategory: "transactional",
    render: () => returnRequestAdminTemplate(sampleOrder(), "damaged", "Chip on the rim of one glass."),
  },
  {
    key: "admin-contact-form",
    label: "Contact Form (Admin)",
    audience: "admin",
    emailCategory: "transactional",
    render: () =>
      contactFormAdminTemplate({
        name: "Priya Naidoo",
        email: "priya@example.com",
        subject: "Question about a gift set",
        message: "Hi there — does the Nightcap Gift Set come with gift wrapping included, or is that an extra at checkout? Thanks!",
      }),
  },
  {
    key: "admin-new-review",
    label: "New Review to Moderate (Admin)",
    audience: "admin",
    emailCategory: "transactional",
    render: () =>
      newReviewAdminTemplate({
        productName: "Aldine Decanter",
        productSlug: "aldine-decanter",
        customerName: "Thabo M.",
        rating: 5,
        title: "Stunning centrepiece",
        body: "Even better in person than in the photos. The stopper seats perfectly.",
      }),
  },
];

export function getTemplate(key: string): TemplateRegistryEntry | undefined {
  return templateRegistry.find((t) => t.key === key);
}
