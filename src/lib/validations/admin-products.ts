import { z } from "zod";

/**
 * Validation for the admin product create/update forms + API routes. Kept
 * permissive on the long tail of optional PDP fields (specs, care
 * instructions, dimensions, etc.) — the required set is only what the
 * catalogue/checkout/order pipeline actually depends on.
 */

const productVariantSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1, "Variant needs a label."),
  priceDelta: z.number().optional(),
  swatch: z.string().trim().optional(),
  images: z.array(z.string().trim().min(1)).optional(),
});

const productOptionSchema = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1, "Option needs a label."),
  priceDelta: z.number().optional(),
});

const productDimensionsSchema = z.object({
  heightCm: z.number().nonnegative(),
  widthCm: z.number().nonnegative(),
  depthCm: z.number().nonnegative(),
});

export const adminProductSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers and hyphens.")
    .optional(),
  sku: z.string().trim().min(2, "Enter a SKU."),
  name: z.string().trim().min(2, "Enter a product name."),
  shortDescription: z.string().trim().min(1, "Enter a short description."),
  description: z.string().trim().min(1, "Enter a full description."),
  price: z.number().nonnegative("Price can't be negative."),
  compareAtPrice: z.number().nonnegative().optional(),
  currency: z.literal("ZAR").default("ZAR"),
  images: z.array(z.string().trim().min(1)).min(1, "Add at least one image."),
  categorySlug: z.string().trim().min(1, "Select a category."),
  productType: z.string().trim().min(1, "Enter a product type."),
  collectionSlugs: z.array(z.string().trim().min(1)).default([]),
  material: z.string().trim().optional(),
  colors: z.array(z.string().trim().min(1)).optional(),
  capacity: z.string().trim().optional(),
  setSize: z.string().trim().optional(),
  setSizeOptions: z.array(productOptionSchema).optional(),
  stockQuantity: z.number().int().nonnegative("Stock can't be negative."),
  discontinued: z.boolean().optional(),
  featured: z.boolean().default(false),
  badges: z.array(z.enum(["New", "Bestseller", "Limited", "Gift Edit"])).optional(),
  variants: z.array(productVariantSchema).optional(),
  videoUrl: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).default([]),
  careInstructions: z.array(z.string().trim().min(1)).default([]),
  dimensions: productDimensionsSchema.optional(),
  weightGrams: z.number().nonnegative().optional(),
  keyBenefits: z.array(z.string().trim().min(1)).optional(),
  lifestyleImage: z.string().trim().optional(),
  lifestyleCaption: z.string().trim().optional(),
  pairsWithSlugs: z.array(z.string().trim().min(1)).optional(),
  packagingInfo: z.string().trim().optional(),

  publishStatus: z.enum(["draft", "published"]).optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  regularPrice: z.number().nonnegative().optional(),
  salePrice: z.number().nonnegative().optional(),
  saleStartsAt: z.string().trim().optional(),
  saleEndsAt: z.string().trim().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
});
export type AdminProductInput = z.infer<typeof adminProductSchema>;

/** Same shape, but every field optional — for PATCH, where only changed fields are sent. */
export const adminProductPatchSchema = adminProductSchema.partial();
export type AdminProductPatchInput = z.infer<typeof adminProductPatchSchema>;
