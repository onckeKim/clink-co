# WhatsApp notifications — dormant scaffold

This structure is ready to use, and inert until you deliberately turn it
on. Nothing in this app calls `sendWhatsAppNotification()` today.

## What's here

- `types.ts` — `WhatsAppMessage`/`WhatsAppProvider` — the same
  one-interface-per-channel shape as `src/lib/email/providers/*.ts`.
- `provider.ts` — a reference implementation against Meta's own WhatsApp
  Business Cloud API. Swap in Twilio, 360dialog, or another BSP by
  implementing the same `WhatsAppProvider` interface in a sibling file.
- `templates.ts` — message builders for order confirmation, shipping
  update, and customer support follow-up.
- `send.ts` — `sendWhatsAppNotification()`, the only entry point. It
  refuses to send unless **all** of the following are true:
  1. `WHATSAPP_ENABLED=true` is set.
  2. The caller passes `hasConsent: true` explicitly — this function never
     assumes or infers consent (not from `marketing_consent`, not from
     anything else). A caller lacking a real consent signal for this
     specific channel should pass `false`, or better, not call this at
     all yet — see "Activating this for real" below.
  3. `WHATSAPP_ACCESS_TOKEN` / `WHATSAPP_PHONE_NUMBER_ID` are set.

Any one of those missing, and it logs why and returns `{ sent: false,
reason }` — never throws, never sends.

## Activating this for real

1. Create a WhatsApp Business Platform app in
   [Meta Business Manager](https://business.facebook.com/), get a
   phone number, and register + get approval for the three templates
   named in `templates.ts` (`order_confirmation`, `shipping_update`,
   `customer_support_followup`) — outside a 24-hour customer-service
   window, only pre-approved templates can be sent (see the comment in
   `provider.ts`).
2. Set `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and
   `WHATSAPP_ENABLED=true` in your environment.
3. **Capture real, explicit consent** — a checkbox on account/checkout
   specifically for WhatsApp notifications (distinct from email marketing
   consent), stored per customer, that a caller reads before passing
   `hasConsent` in. This app doesn't have that capture UI or storage field
   yet; add it before wiring any real call site. Skipping this step and
   passing `hasConsent: true` unconditionally would violate the entire
   point of the gate.
4. Only then wire actual call sites — e.g. `sendWhatsAppNotification({
   message: orderConfirmationWhatsAppMessage(order, customerWhatsAppPhone),
   hasConsent })` alongside the equivalent email send in
   `src/lib/email.ts`.
