"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useCartStore, useCartSubtotal } from "@/store/cart-store";
import { quoteDelivery } from "@/lib/delivery";
import { computeCartTotals } from "@/lib/cart";
import type { DeliveryMethodId } from "@/config/delivery";
import type { PaymentMethodId } from "@/lib/orders/types";
import type { AddressInput, CustomerDetailsInput } from "@/lib/validations/checkout";
import { useMounted } from "@/lib/hooks/use-mounted";
import { track } from "@/lib/analytics/track";

import { CheckoutProgress } from "@/components/checkout/CheckoutProgress";
import { CheckoutSummarySidebar } from "@/components/checkout/CheckoutSummarySidebar";
import { CustomerDetailsStep } from "@/components/checkout/steps/CustomerDetailsStep";
import { DeliveryAddressStep } from "@/components/checkout/steps/DeliveryAddressStep";
import { DeliveryMethodStep } from "@/components/checkout/steps/DeliveryMethodStep";
import { BillingAddressStep } from "@/components/checkout/steps/BillingAddressStep";
import { PaymentMethodStep, type PaymentMethodOption } from "@/components/checkout/steps/PaymentMethodStep";
import { OrderReviewStep } from "@/components/checkout/steps/OrderReviewStep";

const IDEMPOTENCY_STORAGE_KEY = "clink-co-checkout-idempotency-key";

function readOrCreateIdempotencyKey(): string {
  if (typeof window === "undefined") return "";
  const stored = window.sessionStorage.getItem(IDEMPOTENCY_STORAGE_KEY);
  if (stored) return stored;
  const fresh = crypto.randomUUID();
  window.sessionStorage.setItem(IDEMPOTENCY_STORAGE_KEY, fresh);
  return fresh;
}

export function CheckoutView() {
  const mounted = useMounted();
  const router = useRouter();
  const lines = useCartStore((state) => state.lines);
  const subtotal = useCartSubtotal();
  const coupon = useCartStore((state) => state.coupon);

  const [step, setStep] = React.useState(0);
  const [idempotencyKey] = React.useState(readOrCreateIdempotencyKey);

  const [customer, setCustomer] = React.useState<CustomerDetailsInput>();
  const [marketingConsent, setMarketingConsent] = React.useState(false);

  const [deliveryAddress, setDeliveryAddress] = React.useState<AddressInput>();
  const [shippingNotes, setShippingNotes] = React.useState("");
  const [giftMessage, setGiftMessage] = React.useState("");

  const [deliveryMethodId, setDeliveryMethodId] = React.useState<DeliveryMethodId>();

  const [billingSameAsDelivery, setBillingSameAsDelivery] = React.useState(true);
  const [billingAddress, setBillingAddress] = React.useState<AddressInput>();

  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethodId>();
  const [availablePaymentMethods, setAvailablePaymentMethods] = React.useState<PaymentMethodOption[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = React.useState(true);

  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string>();

  React.useEffect(() => {
    if (mounted && lines.length === 0) router.replace("/cart");
  }, [mounted, lines.length, router]);

  const discountAmount = coupon?.discountAmount ?? 0;

  // Fired once, the moment checkout actually has line items to check out —
  // not on every re-render of this step-based component.
  const beginCheckoutTracked = React.useRef(false);
  React.useEffect(() => {
    if (!mounted || lines.length === 0 || beginCheckoutTracked.current) return;
    beginCheckoutTracked.current = true;
    track({
      name: "begin_checkout",
      currency: "ZAR",
      value: Math.max(0, subtotal - discountAmount),
      items: lines.map((line) => ({
        item_id: line.productId,
        item_name: line.name,
        price: line.price,
        quantity: line.quantity,
        item_category: line.categorySlug,
      })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, lines.length]);

  React.useEffect(() => {
    fetch("/api/payments/methods")
      .then((res) => res.json())
      .then((data: { methods: PaymentMethodOption[] }) => setAvailablePaymentMethods(data.methods))
      .catch(() => setAvailablePaymentMethods([]))
      .finally(() => setLoadingPaymentMethods(false));
  }, []);

  const deliveryQuote = React.useMemo(() => {
    if (!deliveryAddress || !deliveryMethodId) return null;
    const result = quoteDelivery({
      methodId: deliveryMethodId,
      province: deliveryAddress.province,
      postalCode: deliveryAddress.postalCode,
      orderValue: Math.max(0, subtotal - discountAmount),
      freeDeliveryOverride: coupon?.freeDelivery ?? false,
    });
    return result.ok ? result.quote : null;
  }, [deliveryAddress, deliveryMethodId, subtotal, discountAmount, coupon]);

  const deliveryFee = deliveryQuote?.fee ?? 0;
  const totals = computeCartTotals({ subtotal, discountAmount, deliveryFee });

  const goTo = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePlaceOrder = async () => {
    if (!customer || !deliveryAddress || !deliveryMethodId || !paymentMethod) return;
    setSubmitting(true);
    setErrorMessage(undefined);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey,
          customer,
          deliveryAddress,
          billingAddress: billingSameAsDelivery ? deliveryAddress : billingAddress,
          billingSameAsDelivery,
          deliveryMethodId,
          paymentMethod,
          couponCode: coupon?.code,
          lines: lines.map((line) => ({ slug: line.slug, variantId: line.variant?.id, quantity: line.quantity })),
          shippingNotes: shippingNotes || undefined,
          giftMessage: giftMessage || undefined,
          marketingConsent,
          termsAccepted: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.error ?? "Something went wrong placing your order. Please try again.");
        setSubmitting(false);
        return;
      }

      window.sessionStorage.removeItem(IDEMPOTENCY_STORAGE_KEY);
      router.push(data.redirectUrl);
    } catch {
      setErrorMessage("Something went wrong placing your order. Please check your connection and try again.");
      setSubmitting(false);
    }
  };

  if (!mounted || lines.length === 0) {
    return <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8" aria-busy="true" />;
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
      <h1 className="font-display mb-2 text-display-lg text-charcoal">Checkout</h1>
      <CheckoutProgress currentStep={step} />

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="rounded-3xl border border-sand p-6 sm:p-8">
          {step === 0 && (
            <CustomerDetailsStep
              defaultValues={customer}
              marketingConsent={marketingConsent}
              onMarketingConsentChange={setMarketingConsent}
              onNext={(data) => {
                setCustomer(data);
                goTo(1);
              }}
            />
          )}

          {step === 1 && (
            <DeliveryAddressStep
              defaultValues={deliveryAddress ?? { fullName: customer ? `${customer.firstName} ${customer.lastName}` : "" }}
              shippingNotes={shippingNotes}
              giftMessage={giftMessage}
              onShippingNotesChange={setShippingNotes}
              onGiftMessageChange={setGiftMessage}
              onBack={() => goTo(0)}
              onNext={(data) => {
                setDeliveryAddress(data);
                goTo(2);
              }}
            />
          )}

          {step === 2 && deliveryAddress && (
            <DeliveryMethodStep
              deliveryAddress={deliveryAddress}
              orderValue={Math.max(0, subtotal - discountAmount)}
              freeDeliveryOverride={coupon?.freeDelivery ?? false}
              selectedMethodId={deliveryMethodId}
              onSelect={setDeliveryMethodId}
              onBack={() => goTo(1)}
              onNext={() => {
                track({
                  name: "add_delivery_information",
                  currency: "ZAR",
                  value: Math.max(0, subtotal - discountAmount) + deliveryFee,
                  shippingTier: deliveryQuote?.label ?? deliveryMethodId,
                });
                goTo(3);
              }}
            />
          )}

          {step === 3 && deliveryAddress && (
            <BillingAddressStep
              deliveryAddress={deliveryAddress}
              sameAsDelivery={billingSameAsDelivery}
              onSameAsDeliveryChange={setBillingSameAsDelivery}
              defaultValues={billingAddress}
              onBack={() => goTo(2)}
              onNext={(data) => {
                setBillingAddress(data);
                goTo(4);
              }}
            />
          )}

          {step === 4 && (
            <PaymentMethodStep
              availableMethods={availablePaymentMethods}
              loading={loadingPaymentMethods}
              selectedMethod={paymentMethod}
              onSelect={setPaymentMethod}
              onBack={() => goTo(3)}
              onNext={() => {
                track({
                  name: "add_payment_information",
                  currency: "ZAR",
                  value: totals.total,
                  paymentType: paymentMethod,
                });
                goTo(5);
              }}
            />
          )}

          {step === 5 && customer && deliveryAddress && deliveryMethodId && paymentMethod && (
            <OrderReviewStep
              lines={lines}
              customer={customer}
              deliveryAddress={deliveryAddress}
              billingAddress={billingSameAsDelivery ? deliveryAddress : (billingAddress ?? deliveryAddress)}
              billingSameAsDelivery={billingSameAsDelivery}
              deliveryMethodLabel={deliveryQuote?.label ?? deliveryMethodId}
              paymentMethodLabel={
                availablePaymentMethods.find((method) => method.id === paymentMethod)?.label ?? paymentMethod
              }
              shippingNotes={shippingNotes || undefined}
              giftMessage={giftMessage || undefined}
              subtotal={subtotal}
              discountAmount={discountAmount}
              couponCode={coupon?.code}
              deliveryFee={deliveryFee}
              taxAmount={totals.taxAmount}
              total={totals.total}
              submitting={submitting}
              errorMessage={errorMessage}
              onBack={() => goTo(4)}
              onEditStep={goTo}
              onPlaceOrder={handlePlaceOrder}
            />
          )}
        </div>

        <CheckoutSummarySidebar
          lines={lines}
          subtotal={subtotal}
          discountAmount={discountAmount}
          couponCode={coupon?.code}
          deliveryFee={deliveryFee}
          deliveryFeeKnown={Boolean(deliveryQuote)}
          taxAmount={totals.taxAmount}
          total={totals.total}
        />
      </div>
    </div>
  );
}
