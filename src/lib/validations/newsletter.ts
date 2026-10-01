import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;

/** Used by the full homepage newsletter section, which also asks for consent. */
export const newsletterSectionSchema = newsletterSchema.extend({
  consent: z.boolean().refine((val) => val === true, {
    message: "Please confirm you'd like to receive emails from us.",
  }),
});

export type NewsletterSectionInput = z.infer<typeof newsletterSectionSchema>;
