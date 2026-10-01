import { z } from "zod";
import { ACCEPTED_IMAGE_TYPES, MAX_IMAGE_SIZE_BYTES } from "@/lib/admin/media-constants";

/**
 * Media uploads arrive as a data: URI in the JSON body (see
 * src/lib/admin/media-store.ts for why) rather than multipart/form-data —
 * simpler for a dev/demo API with no object storage behind it. `sizeBytes`
 * is supplied by the client (from the original File) and re-validated here
 * against the same cap ImageUploader.tsx already checks client-side.
 */
export const uploadMediaSchema = z.object({
  dataUrl: z
    .string()
    .trim()
    .startsWith("data:", "Expected a data: URI.")
    .refine(
      (value) => ACCEPTED_IMAGE_TYPES.some((type) => value.startsWith(`data:${type}`)),
      "Unsupported file type.",
    ),
  filename: z.string().trim().min(1, "Missing filename."),
  mimeType: z.enum(ACCEPTED_IMAGE_TYPES as [string, ...string[]]),
  sizeBytes: z
    .number()
    .int()
    .positive()
    .max(MAX_IMAGE_SIZE_BYTES, `File is larger than ${MAX_IMAGE_SIZE_BYTES / 1024 / 1024}MB.`),
  altText: z.string().trim().optional(),
  folder: z.string().trim().optional(),
  labels: z.array(z.string().trim().min(1)).optional(),
});
export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;

export const replaceMediaSchema = uploadMediaSchema.pick({ dataUrl: true, filename: true, mimeType: true, sizeBytes: true });

export const updateMediaSchema = z.object({
  altText: z.string().trim().optional(),
  folder: z.string().trim().min(1).optional(),
  labels: z.array(z.string().trim().min(1)).optional(),
});
