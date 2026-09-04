import { NextResponse } from "next/server";
import { checkoutRequestSchema } from "@/lib/validations/checkout";
import { validateCartLines } from "@/lib/cart-validation";
import { validateCoupon } from "@/lib/promotions";
import { getCoupons } from "@/data/coupons";
import { redeemCoupon } from "@/lib/admin/coupons-store";
import { computeCartTotals } from "@/lib/cart";
import { quoteDelivery } from "@/lib/delivery";
import { createOrder, findOrderByIdempotencyKey, updateOrder } from "@/lib/orders/store";
import { getPaymentProvider } from "@/lib/payments";
import { sendAdminOrderNotification, sendOrderConfirmationEmail } from "@/lib/email";
import type { OrderLineItem } from "@/lib/orders/types";
import { getUser } from "@/lib/supabase/dal";
import { getStoreSettings } from "@/lib/admin/settings-store";

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

  // A signed-in customer's order is attached to their account from the
  // moment it's created — no separate "claim this order" step needed later,
  // unlike a guest order (see linkGuestOrdersToUser in src/lib/orders/store.ts).
  const user = await getUser();

  const existingOrder = await findOrderByIdempotencyKey(data.idempotencyKey);
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
    const coupons = await getCoupons();
    const couponResult = validateCoupon(
      data.couponCode,
      coupons,
      cartValidation.lines.map((line) => ({
        slug: line.slug,
        categorySlug: line.categorySlug,
        collectionSlugs: line.collectionSlugs,
        lineTotal: line.lineTotal,
      })),
      subtotal,
      new Date(),
      data.customer.email,
    );
    if (!couponResult.valid) {
      return NextResponse.json({ error: couponResult.error, field: "couponCode" }, { status: 409 });
    }
    discountAmount = couponResult.discountAmount;
    freeDeliveryFromCoupon = couponResult.freeDelivery;
  }

  const settings = await getStoreSettings();
  const deliveryQuote = quoteDelivery({
    methodId: data.deliveryMethodId,
    province: data.deliveryAddress.province,
    postalCode: data.deliveryAddress.postalCode,
    orderValue: subtotal - discountAmount,
    freeDeliveryOverride: freeDeliveryFromCoupon,
    freeDeliveryThreshold: settings.freeDeliveryThreshold,
    enabledDeliveryMethodIds: settings.enabledDeliveryMethodIds,
  });
  if (!deliveryQuote.ok) {
    return NextResponse.json({ error: deliveryQuote.error, field: "deliveryMethodId" }, { status: 409 });
  }

  const totals = computeCartTotals({
    subtotal,
    discountAmount,
    deliveryFee: deliveryQuote.quote.fee,
    taxRatePercent: settings.taxRatePercent,
  });

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

  const order = await createOrder({
    idempotencyKey: data.idempotencyKey,
    customerEmail: data.customer.email,
    customerName: customerFullName,
    isGuest: !user,
    userId: user?.id,
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

  if (data.couponCode) {
    // Atomically registers the redemption and increments times_used
    // (db/discounts.ts's redeem_discount_code() RPC row-locks the code for
    // this). The order already exists with discountAmount baked into its
    // totals at this point — a failure here (e.g. a genuine race that
    // exhausted a usage-limited code between the soft validateCoupon()
    // check above and now) shouldn't unwind an order whose payment is
    // already in flight, so it's logged rather than thrown.
    try {
      await redeemCoupon({
        code: data.couponCode,
        orderId: order.id,
        userId: user?.id ?? null,
        customerEmail: data.customer.email,
        amountDiscounted: discountAmount,
      });
    } catch (err) {
      console.error("[checkout] failed to redeem coupon", order.orderNumber, data.couponCode, err);
    }
  }

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

    await updateOrder(order.orderNumber, {
      paymentReference: payment.providerReference,
      paymentRedirectUrl: payment.redirectUrl,
    });

    // Fire-and-forget: email failures must never block order placement.
    void sendAdminOrderNotification(order);
    // "Order confirmed" goes out the moment the order exists, regardless
    // of payment method — a separate "Payment received" email follows
    // once payment actually clears (immediately via webhook for gateway
    // methods; EFT has no gateway callback at all, so its order
    // confirmation doubles as the only email until the admin manually
    // reconciles the bank transfer and marks it paid).
    void sendOrderConfirmationEmail(order);

    return NextResponse.json({ orderNumber: order.orderNumber, redirectUrl: payment.redirectUrl });
  } catch (error) {
    await updateOrder(order.orderNumber, { status: "payment_failed" });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment could not be started." },
      { status: 502 },
    );
  }
}
