import { z } from "zod";

export const newsletterSchema = z.object({
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
});

export type NewsletterInput = z.infer<typeof newsletterSchema>;
