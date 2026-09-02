import { NextResponse } from "next/server";
import { checkoutRequestSchema } from "@/lib/validations/checkout";
import { validateCartLines } from "@/lib/cart-validation";
import { validateCoupon, recordCouponUsage } from "@/lib/promotions";
import { computeCartTotals } from "@/lib/cart";
import { quoteDelivery } from "@/lib/delivery";
import { createOrder, findOrderByIdempotencyKey, updateOrder } from "@/lib/orders/store";
import { getPaymentProvider } from "@/lib/payments";
import { sendAdminOrderNotification, sendOrderConfirmationEmail } from "@/lib/email";
import type { OrderLineItem } from "@/lib/orders/types";

/**
 * Creates an order and initiates payment for it. This is the one route
 * that must never create two orders for what the customer experienced as
 * a single "Place order" click — see the idempotency check right after
 * parsing, and the README's checkout write-up for the full explanation.
 */
export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = checkoutRequestSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Some checkout details are missing or invalid.", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const data = parsed.data;

  const existingOrder = findOrderByIdempotencyKey(data.idempotencyKey);
  if (existingOrder) {
    return NextResponse.json({
      orderNumber: existingOrder.orderNumber,
      redirectUrl: existingOrder.paymentRedirectUrl ?? `/checkout/confirmation/${existingOrder.orderNumber}`,
    });
  }

  const cartValidation = validateCartLines(data.lines);
  if (!cartValidation.ok) {
    return NextResponse.json(
      { error: "Some items in your cart have changed. Please review your cart.", issues: cartValidation.issues },
      { status: 409 },
    );
  }

  const subtotal = cartValidation.lines.reduce((sum, line) => sum + line.lineTotal, 0);

  let discountAmount = 0;
  let freeDeliveryFromCoupon = false;
  if (data.couponCode) {
    const couponResult = validateCoupon(
      data.couponCode,
      cartValidation.lines.map((line) => ({
        slug: line.slug,
        categorySlug: line.categorySlug,
        collectionSlugs: line.collectionSlugs,
        lineTotal: line.lineTotal,
      })),
      subtotal,
    );
    if (!couponResult.valid) {
      return NextResponse.json({ error: couponResult.error, field: "couponCode" }, { status: 409 });
    }
    discountAmount = couponResult.discountAmount;
    freeDeliveryFromCoupon = couponResult.freeDelivery;
  }

  const deliveryQuote = quoteDelivery({
    methodId: data.deliveryMethodId,
    province: data.deliveryAddress.province,
    postalCode: data.deliveryAddress.postalCode,
    orderValue: subtotal - discountAmount,
    freeDeliveryOverride: freeDeliveryFromCoupon,
  });
  if (!deliveryQuote.ok) {
    return NextResponse.json({ error: deliveryQuote.error, field: "deliveryMethodId" }, { status: 409 });
  }

  const totals = computeCartTotals({ subtotal, discountAmount, deliveryFee: deliveryQuote.quote.fee });

  const orderLines: OrderLineItem[] = cartValidation.lines.map((line) => ({
    productId: line.productId,
    slug: line.slug,
    sku: line.sku,
    name: line.name,
    image: line.image,
    variantLabel: line.variantLabel,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    lineTotal: line.lineTotal,
  }));

  const customerFullName = `${data.customer.firstName} ${data.customer.lastName}`.trim();
  const billingAddress = data.billingSameAsDelivery ? data.deliveryAddress : data.billingAddress;

  const provider = getPaymentProvider(data.paymentMethod);
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: `${provider.label} isn't available right now.` }, { status: 400 });
  }

  const order = createOrder({
    idempotencyKey: data.idempotencyKey,
    customerEmail: data.customer.email,
    customerName: customerFullName,
    isGuest: true,
    lines: orderLines,
    couponCode: data.couponCode,
    deliveryAddress: { ...data.deliveryAddress, fullName: data.deliveryAddress.fullName || customerFullName },
    billingAddress: { ...billingAddress, fullName: billingAddress.fullName || customerFullName },
    deliveryMethodId: data.deliveryMethodId,
    deliveryLabel: deliveryQuote.quote.label,
    estimatedDeliveryEarliest: deliveryQuote.quote.earliestDate,
    estimatedDeliveryLatest: deliveryQuote.quote.latestDate,
    shippingNotes: data.shippingNotes,
    giftMessage: data.giftMessage,
    marketingConsent: data.marketingConsent,
    subtotal,
    discountAmount,
    deliveryFee: deliveryQuote.quote.fee,
    taxAmount: totals.taxAmount,
    total: totals.total,
    paymentMethod: data.paymentMethod,
  });

  if (data.couponCode) recordCouponUsage(data.couponCode);

  const origin = new URL(request.url).origin;

  try {
    const payment = await provider.initiate({
      orderNumber: order.orderNumber,
      amount: order.total,
      currency: "ZAR",
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      returnUrl: `${origin}/checkout/confirmation/${order.orderNumber}`,
      cancelUrl: `${origin}/checkout?cancelled=${order.orderNumber}`,
      notifyUrl: `${origin}/api/webhooks/payments/${provider.id}`,
    });

    updateOrder(order.orderNumber, {
      paymentReference: payment.providerReference,
      paymentRedirectUrl: payment.redirectUrl,
    });

    // Fire-and-forget: email failures must never block order placement.
    void sendAdminOrderNotification(order);
    // EFT has no gateway callback — the order is "placed, awaiting manual
    // reconciliation" from the moment it's created, so the customer needs
    // their reference/bank details by email right away rather than
    // waiting on a webhook that will never arrive.
    if (data.paymentMethod === "eft") {
      void sendOrderConfirmationEmail(order);
    }

    return NextResponse.json({ orderNumber: order.orderNumber, redirectUrl: payment.redirectUrl });
  } catch (error) {
    updateOrder(order.orderNumber, { status: "payment_failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment could not be started." },
      { status: 502 },
    );
  }
}
