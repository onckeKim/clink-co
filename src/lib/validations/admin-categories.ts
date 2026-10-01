import { z } from "zod";

export const adminCategorySchema = z.object({
  name: z.string().trim().min(2, "Enter a category name."),
  description: z.string().trim().min(1, "Enter a description."),
  image: z.string().trim().min(1, "Add a category image."),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers and hyphens.")
    .optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
});
export type AdminCategoryInput = z.infer<typeof adminCategorySchema>;

export const adminCategoryPatchSchema = adminCategorySchema.partial();
export type AdminCategoryPatchInput = z.infer<typeof adminCategoryPatchSchema>;

export const reorderCategoriesSchema = z.object({
  orderedIds: z.array(z.string().trim().min(1)).min(1, "Provide the categories' new order."),
});

export const adminCollectionSchema = z.object({
  name: z.string().trim().min(2, "Enter a collection name."),
  description: z.string().trim().min(1, "Enter a description."),
  image: z.string().trim().min(1, "Add a collection image."),
  id: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers and hyphens.")
    .optional(),
});
export type AdminCollectionInput = z.infer<typeof adminCollectionSchema>;

export const adminCollectionPatchSchema = adminCollectionSchema.omit({ id: true }).partial();
export type AdminCollectionPatchInput = z.infer<typeof adminCollectionPatchSchema>;
