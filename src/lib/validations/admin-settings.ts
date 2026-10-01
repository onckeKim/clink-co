import { z } from "zod";

const socialSchema = z.object({
  instagram: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  tiktok: z.string().trim().optional(),
  pinterest: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
});

export const storeSettingsPatchSchema = z.object({
  businessName: z.string().trim().min(1).optional(),
  logoUrl: z.string().trim().optional(),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().optional(),
  taxRatePercent: z.number().min(0).max(100).optional(),
  freeDeliveryThreshold: z.number().nonnegative().optional(),
  enabledDeliveryMethodIds: z.array(z.enum(["standard", "express", "pickup"])).optional(),
  enabledPaymentMethodIds: z.array(z.enum(["test", "payfast", "peach", "yoco", "ozow", "eft"])).optional(),
  emailSenderName: z.string().trim().min(1).optional(),
  emailSenderLocalPart: z
    .string()
    .trim()
    .regex(/^[a-z0-9._-]*$/i, "Use letters, numbers, dots, dashes or underscores only.")
    .optional(),
  orderNotificationEmail: z.string().trim().email().optional(),
  social: socialSchema.partial().optional(),
  orderNumberPrefix: z
    .string()
    .trim()
    .regex(/^[A-Z0-9]{1,6}$/i, "Use 1-6 letters or numbers.")
    .optional(),
  returnWindowDays: z.number().int().positive().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().min(1).optional(),
  abandonedCartEnabled: z.boolean().optional(),
  abandonedCartDelayHours: z.number().int().min(1).max(168).optional(),
});
export type StoreSettingsPatchInput = z.infer<typeof storeSettingsPatchSchema>;
