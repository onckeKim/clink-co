export interface HeroSlide {
  id: string;
  eyebrow: string;
  heading: string;
  copy: string;
  image: string;
  imageAlt: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  sortOrder: number;
}

/** A site-wide dismissible announcement bar — e.g. a shipping deadline or seasonal sale callout. */
export interface PromoBanner {
  id: string;
  message: string;
  href?: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
}

/** The homepage's single editorial/lifestyle feature section ("The Art of Hosting Well"). */
export interface EditorialSection {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
}

export interface AboutPageSection {
  heading: string;
  body: string;
}

export interface AboutPageContent {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroImage: string;
  heroImageAlt: string;
  sections: AboutPageSection[];
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export interface JournalArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  /** Paragraphs, one per array entry — rendered as separate <p> blocks. */
  body: string[];
  coverImage: string;
  coverImageAlt: string;
  author: string;
  publishedAt: string;
  publishStatus: "draft" | "published";
  seoTitle?: string;
  seoDescription?: string;
  /** A single topic grouping — drives the /journal category filter and "related articles". */
  category: string;
  tags: string[];
  /** At most one article should be featured at a time — the journal listing surfaces it first, larger. */
  featured: boolean;
}

/** Long-form legal/policy copy — paragraphs, one per array entry. */
export interface PolicyPageContent {
  title: string;
  updatedAt: string;
  intro: string;
  sections: AboutPageSection[];
}

export type PolicyPageKey =
  | "privacy"
  | "terms"
  | "cookie-policy"
  | "delivery-policy"
  | "returns-policy"
  | "payment-policy"
  | "disclaimer";

export interface NewsletterContent {
  heading: string;
  description: string;
}

/** Which homepage sections show, and in what order — see src/app/page.tsx. */
export interface HomepageSectionsConfig {
  order: string[];
  hidden: string[];
}
