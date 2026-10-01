import { z } from "zod";

export const adminCustomerPatchSchema = z.object({
  marketingConsent: z.boolean().optional(),
});

export const disableCustomerSchema = z.object({
  isDisabled: z.boolean(),
  reason: z.string().trim().optional(),
});

export const customerNoteSchema = z.object({
  note: z.string().trim().min(1, "Enter a note."),
});
