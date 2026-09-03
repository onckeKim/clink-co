import "server-only";
import type { Order } from "@/lib/orders/types";
import type { ReturnReason } from "@/lib/account/returns-store";
import { sendTransactionalEmail } from "@/lib/email/send";
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
} from "@/lib/email/templates/customer-orders";
import { returnRequestReceivedTemplate, returnApprovedTemplate, returnRejectedTemplate } from "@/lib/email/templates/customer-returns";
import {
  newOrderAdminTemplate,
  paymentFailureAdminTemplate,
  lowStockAdminTemplate,
  outOfStockAdminTemplate,
  returnRequestAdminTemplate,
  contactFormAdminTemplate,
  newReviewAdminTemplate,
  type StockAlertProduct,
  type ContactSubmission,
  type NewReviewNotification,
} from "@/lib/email/templates/admin";
import { getStoreSettings } from "@/lib/admin/settings-store";

/**
 * Every trigger point in the app that sends a transactional email goes
 * through one of these — thin wrappers pairing a template
 * (src/lib/email/templates/**) with sendTransactionalEmail() (retry +
 * logging, see src/lib/email/send.ts). None of these throw: a failed or
 * unconfigured email must never fail the order/return/etc. action that
 * triggered it — see each call site in src/app/api/**.
 */

function customerRecipient(order: Pick<Order, "customerName" | "customerEmail">) {
  return { name: order.customerName, email: order.customerEmail };
}

function adminRecipient() {
  const settings = getStoreSettings();
  return { name: `${settings.businessName} Team`, email: settings.orderNotificationEmail };
}

// ---------------------------------------------------------------------------
// Customer — order lifecycle
// ---------------------------------------------------------------------------

export function sendOrderConfirmationEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderConfirmationTemplate(order),
    category: "transactional",
    templateKey: "order-confirmation",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendPaymentReceivedEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: paymentReceivedTemplate(order),
    category: "transactional",
    templateKey: "payment-received",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendPaymentFailedEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: paymentFailedTemplate(order),
    category: "transactional",
    templateKey: "payment-failed",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

/** Not yet triggered anywhere — the app's OrderStatus enum has no discrete "processing" stage (see src/lib/orders/types.ts). Ready to call once a granular fulfilment sub-status exists. */
export function sendOrderProcessingEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderProcessingTemplate(order),
    category: "transactional",
    templateKey: "order-processing",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

/** Same status-model caveat as sendOrderProcessingEmail(). */
export function sendOrderPackedEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderPackedTemplate(order),
    category: "transactional",
    templateKey: "order-packed",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendOrderShippedEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderShippedTemplate(order),
    category: "transactional",
    templateKey: "order-shipped",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendDeliveryConfirmationEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: deliveryConfirmationTemplate(order),
    category: "transactional",
    templateKey: "delivery-confirmation",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendOrderCancelledEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderCancelledTemplate(order),
    category: "transactional",
    templateKey: "order-cancelled",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendRefundProcessedEmail(order: Order) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: refundProcessedTemplate(order),
    category: "transactional",
    templateKey: "refund-processed",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

// ---------------------------------------------------------------------------
// Customer — returns
// ---------------------------------------------------------------------------

export function sendReturnRequestReceivedEmail(order: Order, reason: ReturnReason, notes?: string) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: returnRequestReceivedTemplate(order, reason, notes),
    category: "transactional",
    templateKey: "return-request-received",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

/** Not yet triggered — approving/rejecting a return has no admin action in this build yet (src/lib/account/returns-store.ts's own doc comment names this exact gap). Ready to call from that flow once it exists. */
export function sendReturnApprovedEmail(order: Order, instructions?: string) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: returnApprovedTemplate(order, instructions),
    category: "transactional",
    templateKey: "return-approved",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendReturnRejectedEmail(order: Order, reason: string) {
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: returnRejectedTemplate(order, reason),
    category: "transactional",
    templateKey: "return-rejected",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export function sendAdminOrderNotification(order: Order) {
  return sendTransactionalEmail({
    to: adminRecipient(),
    content: newOrderAdminTemplate(order),
    category: "transactional",
    templateKey: "admin-new-order",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendPaymentFailureAdminNotification(order: Order) {
  return sendTransactionalEmail({
    to: adminRecipient(),
    content: paymentFailureAdminTemplate(order),
    category: "transactional",
    templateKey: "admin-payment-failure",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export function sendLowStockAdminWarning(product: StockAlertProduct) {
  return sendTransactionalEmail({
    to: adminRecipient(),
    content: lowStockAdminTemplate(product),
    category: "transactional",
    templateKey: "admin-low-stock",
    relatedEntityType: "product",
    relatedEntityId: product.id,
  });
}

export function sendOutOfStockAdminWarning(product: Pick<StockAlertProduct, "id" | "name" | "sku">) {
  return sendTransactionalEmail({
    to: adminRecipient(),
    content: outOfStockAdminTemplate(product),
    category: "transactional",
    templateKey: "admin-out-of-stock",
    relatedEntityType: "product",
    relatedEntityId: product.id,
  });
}

export function sendReturnRequestAdminNotification(order: Order, reason: ReturnReason, notes?: string) {
  return sendTransactionalEmail({
    to: adminRecipient(),
    content: returnRequestAdminTemplate(order, reason, notes),
    category: "transactional",
    templateKey: "admin-return-request",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

/** Not yet triggered — there's no contact form in this build yet to submit from. Ready to call from POST /api/contact once that page/route exists. */
export function sendContactFormAdminNotification(submission: ContactSubmission) {
  return sendTransactionalEmail({
    to: adminRecipient(),
    content: contactFormAdminTemplate(submission),
    category: "transactional",
    templateKey: "admin-contact-form",
    relatedEntityType: "contact",
    relatedEntityId: submission.email,
  });
}

/** Not yet triggered — src/components/product/ReviewsSection.tsx's submission flow is client-only (no server persistence yet), so there's no server-side moment to call this from. Ready to call once review submission is wired to a real store/table. */
export function sendNewReviewAdminNotification(review: NewReviewNotification) {
  return sendTransactionalEmail({
    to: adminRecipient(),
    content: newReviewAdminTemplate(review),
    category: "transactional",
    templateKey: "admin-new-review",
    relatedEntityType: "product",
    relatedEntityId: review.productSlug,
  });
}
