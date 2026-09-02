import type { PaymentMethodId } from "@/lib/orders/types";
import type { PaymentProvider } from "./types";
import { testProvider } from "./providers/test";
import { eftProvider, eftBankDetails } from "./providers/eft";
import { payfastProvider } from "./providers/payfast";
import { ozowProvider } from "./providers/ozow";
import { yocoProvider } from "./providers/yoco";
import { peachProvider } from "./providers/peach";

export const paymentProviders: Record<PaymentMethodId, PaymentProvider> = {
  test: testProvider,
  eft: eftProvider,
  payfast: payfastProvider,
  ozow: ozowProvider,
  yoco: yocoProvider,
  peach: peachProvider,
};

export function getPaymentProvider(id: PaymentMethodId): PaymentProvider {
  return paymentProviders[id];
}

/** Every method whose credentials (or, for EFT/test, admin toggle) are currently present — what the checkout UI should actually offer. */
export function getAvailablePaymentMethods(): PaymentProvider[] {
  return Object.values(paymentProviders).filter((provider) => provider.isConfigured());
}

export { eftBankDetails };
export type { PaymentProvider, InitiatePaymentParams, InitiatePaymentResult, NormalizedWebhookEvent } from "./types";
