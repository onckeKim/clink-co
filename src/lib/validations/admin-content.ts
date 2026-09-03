import { z } from "zod";

const ctaSchema = z.object({ label: z.string().trim().min(1), href: z.string().trim().min(1) });

export const heroSlideSchema = z.object({
  eyebrow: z.string().trim().min(1, "Enter an eyebrow label."),
  heading: z.string().trim().min(1, "Enter a heading."),
  copy: z.string().trim().min(1, "Enter body copy."),
  image: z.string().trim().min(1, "Add an image."),
  imageAlt: z.string().trim().min(1, "Add alt text."),
  primaryCta: ctaSchema,
  secondaryCta: ctaSchema,
});
export const heroSlidePatchSchema = heroSlideSchema.partial();
export const reorderHeroSlidesSchema = z.object({ orderedIds: z.array(z.string().trim().min(1)).min(1) });

export const bannerSchema = z.object({
  message: z.string().trim().min(1, "Enter a banner message."),
  href: z.string().trim().optional(),
  active: z.boolean().default(true),
  startsAt: z.string().trim().optional(),
  endsAt: z.string().trim().optional(),
});
export const bannerPatchSchema = bannerSchema.partial();

export const editorialSectionSchema = z.object({
  eyebrow: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  ctaLabel: z.string().trim().min(1),
  ctaHref: z.string().trim().min(1),
  image: z.string().trim().min(1),
  imageAlt: z.string().trim().min(1),
});
export const editorialSectionPatchSchema = editorialSectionSchema.partial();

const aboutSectionSchema = z.object({ heading: z.string().trim().min(1), body: z.string().trim().min(1) });
export const aboutPageSchema = z.object({
  heroEyebrow: z.string().trim().min(1),
  heroTitle: z.string().trim().min(1),
  heroDescription: z.string().trim().min(1),
  heroImage: z.string().trim().min(1),
  heroImageAlt: z.string().trim().min(1),
  sections: z.array(aboutSectionSchema).min(1),
});
export const aboutPagePatchSchema = aboutPageSchema.partial();

export const faqSchema = z.object({
  question: z.string().trim().min(1, "Enter a question."),
  answer: z.string().trim().min(1, "Enter an answer."),
  category: z.string().trim().min(1, "Enter a category."),
  sortOrder: z.number().int().default(0),
});
export const faqPatchSchema = faqSchema.partial();

export const articleSchema = z.object({
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, "Slug may only contain lowercase letters, numbers and hyphens.")
    .optional(),
  title: z.string().trim().min(2, "Enter a title."),
  excerpt: z.string().trim().min(1, "Enter an excerpt."),
  body: z.array(z.string().trim().min(1)).min(1, "Add at least one paragraph."),
  coverImage: z.string().trim().min(1, "Add a cover image."),
  coverImageAlt: z.string().trim().min(1, "Add alt text."),
  author: z.string().trim().min(1, "Enter an author."),
  publishedAt: z.string().trim().min(1, "Set a publish date."),
  publishStatus: z.enum(["draft", "published"]).default("draft"),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
});
export const articlePatchSchema = articleSchema.partial();

export const policyPageSchema = z.object({
  title: z.string().trim().min(1),
  updatedAt: z.string().trim().min(1),
  intro: z.string().trim().min(1),
  sections: z.array(aboutSectionSchema).min(1),
});
export const policyPagePatchSchema = policyPageSchema.partial();

export const newsletterContentSchema = z.object({
  heading: z.string().trim().min(1),
  description: z.string().trim().min(1),
});
export const newsletterContentPatchSchema = newsletterContentSchema.partial();

export const homepageSectionsSchema = z.object({
  order: z.array(z.string().trim().min(1)).min(1),
  hidden: z.array(z.string().trim().min(1)),
});
export const homepageSectionsPatchSchema = homepageSectionsSchema.partial();
