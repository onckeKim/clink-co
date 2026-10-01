import { z } from "zod";

export const ENQUIRY_CATEGORIES = [
  "Order Enquiry",
  "Product Question",
  "Delivery & Tracking",
  "Returns & Refunds",
  "Corporate Gifting",
  "Other",
] as const;

export type EnquiryCategory = (typeof ENQUIRY_CATEGORIES)[number];

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(200),
  email: z.string().trim().min(1, "Enter your email address.").email("Enter a valid email address."),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  orderNumber: z.string().trim().max(40).optional().or(z.literal("")),
  category: z.enum(ENQUIRY_CATEGORIES, { message: "Choose an enquiry category." }),
  message: z.string().trim().min(10, "Tell us a little more — at least 10 characters.").max(4000),
  consent: z.boolean().refine((val) => val === true, {
    message: "Please confirm you're happy for us to use these details to respond to your enquiry.",
  }),
  /**
   * Honeypot — a field real visitors never see or fill (hidden off-screen,
   * never focusable) but a scripted bot filling every input on the page
   * will. Any non-empty value here means "silently drop this", not "show
   * a validation error" — see POST /api/contact, which returns the same
   * success response either way so a bot gets no signal to adapt to.
   */
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
