import { z } from "zod";

export const adminCouponSchema = z
  .object({
    code: z.string().trim().min(2, "Enter a coupon code."),
    description: z.string().trim().min(1, "Enter a description."),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().nonnegative("Discount can't be negative."),
    freeDelivery: z.boolean().default(false),
    minSpend: z.number().nonnegative().optional(),
    startsAt: z.string().trim().optional(),
    endsAt: z.string().trim().optional(),
    productSlugs: z.array(z.string().trim().min(1)).optional(),
    collectionSlugs: z.array(z.string().trim().min(1)).optional(),
    customerEmails: z.array(z.string().trim().email()).optional(),
    usageLimit: z.number().int().positive().optional(),
    active: z.boolean().default(true),
    requiresCode: z.boolean().default(true),
  })
  .refine((data) => data.discountType !== "percentage" || data.discountValue <= 100, {
    message: "A percentage discount can't exceed 100%.",
    path: ["discountValue"],
  });
export type AdminCouponInput = z.infer<typeof adminCouponSchema>;

export const adminCouponPatchSchema = z.object({
  code: z.string().trim().min(2).optional(),
  description: z.string().trim().min(1).optional(),
  discountType: z.enum(["percentage", "fixed"]).optional(),
  discountValue: z.number().nonnegative().optional(),
  freeDelivery: z.boolean().optional(),
  minSpend: z.number().nonnegative().optional(),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
  productSlugs: z.array(z.string().trim().min(1)).optional(),
  collectionSlugs: z.array(z.string().trim().min(1)).optional(),
  customerEmails: z.array(z.string().trim().email()).optional(),
  usageLimit: z.number().int().positive().optional(),
  active: z.boolean().optional(),
  requiresCode: z.boolean().optional(),
});
export type AdminCouponPatchInput = z.infer<typeof adminCouponPatchSchema>;
