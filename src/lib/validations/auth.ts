import { z } from "zod";
import { addressSchema } from "@/lib/validations/checkout";

const passwordField = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[a-z]/, "Include a lowercase letter.")
  .regex(/[A-Z]/, "Include an uppercase letter.")
  .regex(/[0-9]/, "Include a number.");

const signUpFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: passwordField,
  confirmPassword: z.string().min(1, "Confirm your password."),
});
const passwordsMatch = (data: { password: string; confirmPassword: string }) => data.password === data.confirmPassword;
const passwordsMatchRefinement = {
  message: "Passwords don't match.",
  path: ["confirmPassword"],
};

/**
 * The name/email/password fields only — what SignupForm's react-hook-form
 * instance actually registers and validates. `marketingConsent` and
 * `termsAccepted` are deliberately excluded: both are driven by the custom
 * Checkbox component (checked/onCheckedChange, not a native input RHF can
 * register) and lifted into separate useState, matching the same pattern
 * CustomerDetailsStep/OrderReviewStep use for their checkboxes elsewhere in
 * checkout. Validating them through this resolver would silently and
 * permanently fail (RHF would never see a value for either field), which is
 * exactly the bug this split avoids.
 */
export const signUpFormSchema = signUpFieldsSchema.refine(passwordsMatch, passwordsMatchRefinement);
export type SignUpFormInput = z.infer<typeof signUpFormSchema>;

/** The full sign-up payload, including the two checkbox fields — what the client sends to and the server validates in POST /api/auth/signup. */
export const signUpSchema = signUpFieldsSchema
  .extend({
    marketingConsent: z.boolean(),
    termsAccepted: z.boolean().refine((value) => value === true, {
      message: "You must accept the Terms of Service and Privacy Policy.",
    }),
  })
  .refine(passwordsMatch, passwordsMatchRefinement);
export type SignUpInput = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordField,
    confirmNewPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords don't match.",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "Your new password must be different from your current password.",
    path: ["newPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

const profileFieldsSchema = z.object({
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  phone: z
    .string()
    .trim()
    .min(10, "Enter a valid phone number.")
    .regex(/^[0-9+()\s-]+$/, "Enter a valid phone number.")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z.string().trim().optional().or(z.literal("")),
});

/** What ProfileView's react-hook-form instance validates — marketingConsent is excluded for the same reason SignUpFormInput excludes it (see above): it's driven by the custom Checkbox, lifted into separate useState, and merged in at submit time. */
export const profileFormSchema = profileFieldsSchema;
export type ProfileFormInput = z.infer<typeof profileFormSchema>;

/** The full profile payload, including marketingConsent — what the client sends to and the server validates in PATCH /api/account/profile. */
export const profileSchema = profileFieldsSchema.extend({ marketingConsent: z.boolean() });
export type ProfileInput = z.infer<typeof profileSchema>;

export const preferencesSchema = z.object({
  marketingConsent: z.boolean(),
});
export type PreferencesInput = z.infer<typeof preferencesSchema>;

/** The account address book extends checkout's address shape with a label and default flags. */
export const accountAddressSchema = addressSchema.extend({
  label: z.string().trim().max(40, "Keep the label under 40 characters.").optional(),
  isDefaultDelivery: z.boolean().optional(),
  isDefaultBilling: z.boolean().optional(),
});
export type AccountAddressInput = z.infer<typeof accountAddressSchema>;

export const returnRequestSchema = z.object({
  reason: z.enum(["changed-mind", "damaged", "wrong-item", "not-as-described", "other"], {
    message: "Select a reason for your return.",
  }),
  notes: z.string().trim().max(500, "Keep your notes under 500 characters.").optional(),
  /**
   * Data-URI images — optional evidence, most useful for a "damaged" or
   * "not-as-described" reason. Capped at 4 so a customer can't balloon the
   * in-memory store with an unbounded upload. The client already enforces
   * MAX_IMAGE_SIZE_BYTES/ACCEPTED_IMAGE_TYPES (src/lib/admin/media-constants.ts)
   * per file before encoding; this regex + length cap is the server-side
   * re-check (a client-side check alone can always be bypassed) — roughly
   * 2MB of base64 is ~2.8M characters.
   */
  evidenceImages: z
    .array(
      z
        .string()
        .trim()
        .regex(/^data:image\/(jpeg|png|webp|gif);base64,/, "Evidence must be an image file.")
        .max(2_850_000, "Image is too large."),
    )
    .max(4, "You can attach up to 4 photos.")
    .optional(),
});
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>;
