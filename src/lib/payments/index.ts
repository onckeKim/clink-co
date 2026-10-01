import type { PaymentMethodId } from "@/lib/orders/types";
import { getStoreSettings } from "@/lib/admin/settings-store";
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

/** Every method whose credentials are currently present AND that the admin has enabled in store settings (Store Settings → Payment methods) — what the checkout UI should actually offer. */
export async function getAvailablePaymentMethods(): Promise<PaymentProvider[]> {
  const settings = await getStoreSettings();
  const enabledIds = settings.enabledPaymentMethodIds;
  return Object.values(paymentProviders).filter(
    (provider) => provider.isConfigured() && enabledIds.includes(provider.id),
  );
}

export { eftBankDetails };
export type { PaymentProvider, InitiatePaymentParams, InitiatePaymentResult, NormalizedWebhookEvent } from "./types";
