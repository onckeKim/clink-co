import type { PaymentProvider } from "../types";
import { eftBankDetails } from "@/config/payments";

export { eftBankDetails };

/**
 * EFT / bank transfer — no gateway account required, so it's "configured"
 * whenever the administrator enables it via EFT_ENABLED. There's no
 * redirect step: the order is created as `pending_payment` and the
 * customer is sent straight to the confirmation page showing the bank
 * details and their order's payment reference to use. There's also no
 * automated webhook — a real deployment reconciles these manually (an
 * admin marks the order paid once the transfer clears), which is why
 * parseWebhook() always returns null here.
 */
export const eftProvider: PaymentProvider = {
  id: "eft",
  label: "EFT / Bank Transfer",
  description: "Pay via direct bank transfer — order ships once payment is confirmed by our team.",

  isConfigured() {
    return process.env.EFT_ENABLED !== "false";
  },

  async initiate({ orderNumber }) {
    return {
      redirectUrl: `/checkout/confirmation/${orderNumber}`,
      providerReference: `EFT-${orderNumber}`,
    };
  },

  parseWebhook() {
    return null;
  },
};
