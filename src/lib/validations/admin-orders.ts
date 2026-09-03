import { z } from "zod";

export const orderStatusSchema = z.object({
  status: z.enum(["pending_payment", "paid", "payment_failed", "cancelled", "fulfilled"]),
});

export const orderTrackingSchema = z.object({
  trackingCarrier: z.string().trim().min(1, "Enter a carrier."),
  trackingNumber: z.string().trim().min(1, "Enter a tracking number."),
  trackingUrl: z.string().trim().optional(),
});

export const cancelOrderSchema = z.object({
  reason: z.string().trim().optional(),
});

export const refundOrderSchema = z.object({
  amount: z.number().positive("Enter a refund amount greater than 0."),
  reason: z.string().trim().optional(),
});

export const orderNoteSchema = z.object({
  note: z.string().trim().min(1, "Enter a note."),
});
