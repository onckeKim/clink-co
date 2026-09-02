import { z } from "zod";
import { southAfricanProvinces } from "@/data/provinces";

export const addressSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a full name."),
  line1: z.string().trim().min(3, "Enter a street address."),
  line2: z.string().trim().optional(),
  suburb: z.string().trim().min(2, "Enter a suburb."),
  city: z.string().trim().min(2, "Enter a city."),
  province: z.enum(southAfricanProvinces, { message: "Select a province." }),
  postalCode: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "Enter a valid 4-digit postal code."),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number.")
    .regex(/^[0-9+()\s-]+$/, "Enter a valid phone number."),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const customerDetailsSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number.")
    .regex(/^[0-9+()\s-]+$/, "Enter a valid phone number."),
  createAccount: z.boolean().optional(),
});
export type CustomerDetailsInput = z.infer<typeof customerDetailsSchema>;

export const deliveryMethodSchema = z.object({
  deliveryMethodId: z.enum(["standard", "express", "pickup"], { message: "Select a delivery method." }),
});
export type DeliveryMethodInput = z.infer<typeof deliveryMethodSchema>;

export const paymentMethodSchema = z.object({
  paymentMethod: z.enum(["test", "payfast", "peach", "yoco", "ozow", "eft"], {
    message: "Select a payment method.",
  }),
});
export type PaymentMethodInput = z.infer<typeof paymentMethodSchema>;

export const orderExtrasSchema = z.object({
  shippingNotes: z.string().trim().max(500, "Keep shipping notes under 500 characters.").optional(),
  giftMessage: z.string().trim().max(300, "Keep the gift message under 300 characters.").optional(),
  marketingConsent: z.boolean(),
  termsAccepted: z.boolean().refine((value) => value === true, {
    message: "You must accept the Terms of Service to place your order.",
  }),
});
export type OrderExtrasInput = z.infer<typeof orderExtrasSchema>;

/** The full server-side payload for POST /api/checkout — every step's data combined. */
export const checkoutRequestSchema = z.object({
  idempotencyKey: z.string().trim().min(1),
  customer: customerDetailsSchema,
  deliveryAddress: addressSchema,
  billingAddress: addressSchema,
  billingSameAsDelivery: z.boolean(),
  deliveryMethodId: deliveryMethodSchema.shape.deliveryMethodId,
  paymentMethod: paymentMethodSchema.shape.paymentMethod,
  couponCode: z.string().trim().optional(),
  lines: z
    .array(
      z.object({
        slug: z.string().trim().min(1),
        variantId: z.string().trim().optional(),
        quantity: z.number().int().min(1).max(99),
      }),
    )
    .min(1, "Your cart is empty."),
  shippingNotes: orderExtrasSchema.shape.shippingNotes,
  giftMessage: orderExtrasSchema.shape.giftMessage,
  marketingConsent: orderExtrasSchema.shape.marketingConsent,
  termsAccepted: orderExtrasSchema.shape.termsAccepted,
});
export type CheckoutRequestInput = z.infer<typeof checkoutRequestSchema>;
