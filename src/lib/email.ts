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
import type { StoreSettings } from "@/types/settings";

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

function adminRecipient(settings: StoreSettings) {
  return { name: `${settings.businessName} Team`, email: settings.orderNotificationEmail };
}

// ---------------------------------------------------------------------------
// Customer — order lifecycle
// ---------------------------------------------------------------------------

export async function sendOrderConfirmationEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderConfirmationTemplate(order, settings),
    category: "transactional",
    templateKey: "order-confirmation",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendPaymentReceivedEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: paymentReceivedTemplate(order, settings),
    category: "transactional",
    templateKey: "payment-received",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendPaymentFailedEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: paymentFailedTemplate(order, settings),
    category: "transactional",
    templateKey: "payment-failed",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

/** Not yet triggered anywhere — the app's OrderStatus enum has no discrete "processing" stage (see src/lib/orders/types.ts). Ready to call once a granular fulfilment sub-status exists. */
export async function sendOrderProcessingEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderProcessingTemplate(order, settings),
    category: "transactional",
    templateKey: "order-processing",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

/** Same status-model caveat as sendOrderProcessingEmail(). */
export async function sendOrderPackedEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderPackedTemplate(order, settings),
    category: "transactional",
    templateKey: "order-packed",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendOrderShippedEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderShippedTemplate(order, settings),
    category: "transactional",
    templateKey: "order-shipped",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendDeliveryConfirmationEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: deliveryConfirmationTemplate(order, settings),
    category: "transactional",
    templateKey: "delivery-confirmation",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendOrderCancelledEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: orderCancelledTemplate(order, settings),
    category: "transactional",
    templateKey: "order-cancelled",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendRefundProcessedEmail(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: refundProcessedTemplate(order, settings),
    category: "transactional",
    templateKey: "refund-processed",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

// ---------------------------------------------------------------------------
// Customer — returns
// ---------------------------------------------------------------------------

export async function sendReturnRequestReceivedEmail(order: Order, reason: ReturnReason, notes?: string) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: returnRequestReceivedTemplate(order, reason, notes, settings),
    category: "transactional",
    templateKey: "return-request-received",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

/** Not yet triggered — approving/rejecting a return has no admin action in this build yet (src/lib/account/returns-store.ts's own doc comment names this exact gap). Ready to call from that flow once it exists. */
export async function sendReturnApprovedEmail(order: Order, instructions?: string) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: returnApprovedTemplate(order, instructions, settings),
    category: "transactional",
    templateKey: "return-approved",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendReturnRejectedEmail(order: Order, reason: string) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: customerRecipient(order),
    content: returnRejectedTemplate(order, reason, settings),
    category: "transactional",
    templateKey: "return-rejected",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function sendAdminOrderNotification(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: adminRecipient(settings),
    content: newOrderAdminTemplate(order, settings),
    category: "transactional",
    templateKey: "admin-new-order",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendPaymentFailureAdminNotification(order: Order) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: adminRecipient(settings),
    content: paymentFailureAdminTemplate(order, settings),
    category: "transactional",
    templateKey: "admin-payment-failure",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

export async function sendLowStockAdminWarning(product: StockAlertProduct) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: adminRecipient(settings),
    content: lowStockAdminTemplate(product, settings),
    category: "transactional",
    templateKey: "admin-low-stock",
    relatedEntityType: "product",
    relatedEntityId: product.id,
  });
}

export async function sendOutOfStockAdminWarning(product: Pick<StockAlertProduct, "id" | "name" | "sku">) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: adminRecipient(settings),
    content: outOfStockAdminTemplate(product, settings),
    category: "transactional",
    templateKey: "admin-out-of-stock",
    relatedEntityType: "product",
    relatedEntityId: product.id,
  });
}

export async function sendReturnRequestAdminNotification(order: Order, reason: ReturnReason, notes?: string) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: adminRecipient(settings),
    content: returnRequestAdminTemplate(order, reason, notes, settings),
    category: "transactional",
    templateKey: "admin-return-request",
    relatedEntityType: "order",
    relatedEntityId: order.orderNumber,
  });
}

/** Not yet triggered — there's no contact form in this build yet to submit from. Ready to call from POST /api/contact once that page/route exists. */
export async function sendContactFormAdminNotification(submission: ContactSubmission) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: adminRecipient(settings),
    content: contactFormAdminTemplate(submission, settings),
    category: "transactional",
    templateKey: "admin-contact-form",
    relatedEntityType: "contact",
    relatedEntityId: submission.email,
  });
}

/** Not yet triggered — src/components/product/ReviewsSection.tsx's submission flow is client-only (no server persistence yet), so there's no server-side moment to call this from. Ready to call once review submission is wired to a real store/table. */
export async function sendNewReviewAdminNotification(review: NewReviewNotification) {
  const settings = await getStoreSettings();
  return sendTransactionalEmail({
    to: adminRecipient(settings),
    content: newReviewAdminTemplate(review, settings),
    category: "transactional",
    templateKey: "admin-new-review",
    relatedEntityType: "product",
    relatedEntityId: review.productSlug,
  });
}
