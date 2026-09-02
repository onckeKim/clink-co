import type { PaymentMethodId } from "@/lib/orders/types";

export interface InitiatePaymentParams {
  orderNumber: string;
  /** Rand, e.g. 1450.00. */
  amount: number;
  currency: "ZAR";
  customerEmail: string;
  customerName: string;
  /** Where the provider should send the browser back after a completed (success or cancelled) payment. */
  returnUrl: string;
  cancelUrl: string;
  /** Server-to-server webhook endpoint for this provider. */
  notifyUrl: string;
}

export interface InitiatePaymentResult {
  /** Where to send the customer's browser to complete payment (a hosted gateway page, or — for EFT — straight to the confirmation page). */
  redirectUrl: string;
  /** The provider's identifier for this payment attempt, stored on the order and used to match incoming webhooks. */
  providerReference: string;
}

export type NormalizedPaymentStatus = "paid" | "failed" | "cancelled" | "pending";

export interface NormalizedWebhookEvent {
  providerReference: string;
  orderNumber?: string;
  status: NormalizedPaymentStatus;
  /** Unique per event — used as the idempotency key so a redelivered webhook doesn't get processed twice. */
  eventId: string;
  raw: unknown;
}

export interface PaymentProvider {
  id: PaymentMethodId;
  label: string;
  description: string;
  /** True once the required credentials are present in the environment — see each provider's file for exactly which vars. */
  isConfigured(): boolean;
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  /**
   * Verifies and normalizes an inbound webhook payload. Returns `null` when
   * the signature doesn't check out (the caller should respond 400 and NOT
   * act on the payload) rather than throwing, so a single malformed/spoofed
   * delivery can't take down the route.
   */
  parseWebhook(rawBody: string, headers: Record<string, string>): NormalizedWebhookEvent | null;
}
