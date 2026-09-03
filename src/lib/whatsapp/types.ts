/**
 * WhatsApp notification structure — dormant by design. Nothing in this
 * directory sends a message on its own; every call site must pass
 * `hasConsent: true` explicitly (see send.ts), and the feature stays fully
 * off until both WHATSAPP_ENABLED=true and real Meta Business API
 * credentials are set. See src/lib/whatsapp/README.md for the activation
 * checklist.
 */

export interface WhatsAppRecipient {
  /** E.164 format, e.g. "+27821234567". */
  phone: string;
  name: string;
}

export interface WhatsAppMessage {
  to: WhatsAppRecipient;
  /**
   * Outside a 24-hour customer-service window (the customer's last
   * inbound message to your business number), the WhatsApp Business
   * Platform only allows pre-approved "template" messages, not arbitrary
   * text — see https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates.
   * `templateName` is the exact name of a template already approved in
   * Meta Business Manager; `templateParams` fills its placeholders in
   * order. `body` is used only for the console/dev provider's log output
   * and for a same-day reply that falls inside the 24-hour window.
   */
  templateName: string;
  templateParams: string[];
  body: string;
}

export interface WhatsAppSendResult {
  sent: boolean;
  reason?: string;
  providerMessageId?: string;
}

export interface WhatsAppProvider {
  send(message: WhatsAppMessage): Promise<WhatsAppSendResult>;
}
