import type {
  AboutPageContent,
  EditorialSection,
  FaqEntry,
  HeroSlide,
  HomepageSectionsConfig,
  JournalArticle,
  NewsletterContent,
  PolicyPageContent,
  PolicyPageKey,
  PromoBanner,
} from "@/types/content";
import {
  heroSlidesSeed,
  bannersSeed,
  editorialSeed,
  aboutPageSeed,
  faqsSeed,
  journalArticlesSeed,
  policiesSeed,
  newsletterSeed,
  homepageSectionsSeed,
} from "@/data/content-seed";

/**
 * In-memory content store — same rationale/pattern as the other admin
 * stores. Everything the "Content management" and homepage marketing
 * surfaces read is a live function call into this module, so an admin edit
 * shows up on the storefront immediately, without a redeploy (see the
 * README's admin section).
 *
 * List-shaped content (hero slides, banners, FAQs, journal articles) lives
 * in an id-keyed Map, same as products/categories/collections. Singleton
 * content (the one editorial section, the about page, newsletter copy, the
 * homepage's section order, each policy page) is just a mutable module
 * variable, reassigned wholesale on update — there's only ever one of each,
 * so a Map would be unnecessary.
 */

function generateId(prefix: string): string {
  return `${prefix}-admin-${crypto.randomUUID().slice(0, 8)}`;
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// ---------------------------------------------------------------------------
// Hero slides
// ---------------------------------------------------------------------------

const heroSlidesById = new Map<string, HeroSlide>(heroSlidesSeed.map((s) => [s.id, structuredClone(s)]));

export function getHeroSlides(): HeroSlide[] {
  return [...heroSlidesById.values()].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAdminHeroSlideById(id: string): HeroSlide | undefined {
  return heroSlidesById.get(id);
}

export type CreateHeroSlideInput = Omit<HeroSlide, "id" | "sortOrder">;

export function createHeroSlide(input: CreateHeroSlideInput): HeroSlide {
  const id = generateId("hero");
  const sortOrder = heroSlidesById.size > 0 ? Math.max(...[...heroSlidesById.values()].map((s) => s.sortOrder)) + 1 : 0;
  const slide: HeroSlide = { ...input, id, sortOrder };
  heroSlidesById.set(id, slide);
  return slide;
}

export function updateHeroSlide(id: string, patch: Partial<CreateHeroSlideInput>): HeroSlide | undefined {
  const existing = heroSlidesById.get(id);
  if (!existing) return undefined;
  const updated: HeroSlide = { ...existing, ...patch, id };
  heroSlidesById.set(id, updated);
  return updated;
}

export function deleteHeroSlide(id: string): boolean {
  return heroSlidesById.delete(id);
}

export function reorderHeroSlides(orderedIds: string[]): HeroSlide[] {
  orderedIds.forEach((id, index) => {
    const existing = heroSlidesById.get(id);
    if (existing) heroSlidesById.set(id, { ...existing, sortOrder: index });
  });
  return getHeroSlides();
}

// ---------------------------------------------------------------------------
// Promotional banners
// ---------------------------------------------------------------------------

const bannersById = new Map<string, PromoBanner>(bannersSeed.map((b) => [b.id, structuredClone(b)]));

/** Active banners whose date window (if any) currently includes `now` — what the storefront announcement bar renders. */
export function getActiveBanners(now: Date = new Date()): PromoBanner[] {
  return [...bannersById.values()].filter((b) => {
    if (!b.active) return false;
    if (b.startsAt && now < new Date(`${b.startsAt}T00:00:00`)) return false;
    if (b.endsAt && now > new Date(`${b.endsAt}T23:59:59`)) return false;
    return true;
  });
}

export function listAdminBanners(): PromoBanner[] {
  return [...bannersById.values()];
}

export function getAdminBannerById(id: string): PromoBanner | undefined {
  return bannersById.get(id);
}

export type CreateBannerInput = Omit<PromoBanner, "id">;

export function createBanner(input: CreateBannerInput): PromoBanner {
  const id = generateId("banner");
  const banner: PromoBanner = { ...input, id };
  bannersById.set(id, banner);
  return banner;
}

export function updateBanner(id: string, patch: Partial<CreateBannerInput>): PromoBanner | undefined {
  const existing = bannersById.get(id);
  if (!existing) return undefined;
  const updated: PromoBanner = { ...existing, ...patch, id };
  bannersById.set(id, updated);
  return updated;
}

export function deleteBanner(id: string): boolean {
  return bannersById.delete(id);
}

// ---------------------------------------------------------------------------
// Editorial section (homepage "The Art of Hosting Well")
// ---------------------------------------------------------------------------

let editorial: EditorialSection = structuredClone(editorialSeed);

export function getEditorialSection(): EditorialSection {
  return editorial;
}

export function updateEditorialSection(patch: Partial<EditorialSection>): EditorialSection {
  editorial = { ...editorial, ...patch };
  return editorial;
}

// ---------------------------------------------------------------------------
// About page
// ---------------------------------------------------------------------------

let aboutPage: AboutPageContent = structuredClone(aboutPageSeed);

export function getAboutPageContent(): AboutPageContent {
  return aboutPage;
}

export function updateAboutPageContent(patch: Partial<AboutPageContent>): AboutPageContent {
  aboutPage = { ...aboutPage, ...patch };
  return aboutPage;
}

// ---------------------------------------------------------------------------
// FAQs
// ---------------------------------------------------------------------------

const faqsById = new Map<string, FaqEntry>(faqsSeed.map((f) => [f.id, structuredClone(f)]));

export function getFaqs(): FaqEntry[] {
  return [...faqsById.values()].sort((a, b) => a.category.localeCompare(b.category) || a.sortOrder - b.sortOrder);
}

export function getAdminFaqById(id: string): FaqEntry | undefined {
  return faqsById.get(id);
}

export type CreateFaqInput = Omit<FaqEntry, "id">;

export function createFaq(input: CreateFaqInput): FaqEntry {
  const id = generateId("faq");
  const faq: FaqEntry = { ...input, id };
  faqsById.set(id, faq);
  return faq;
}

export function updateFaq(id: string, patch: Partial<CreateFaqInput>): FaqEntry | undefined {
  const existing = faqsById.get(id);
  if (!existing) return undefined;
  const updated: FaqEntry = { ...existing, ...patch, id };
  faqsById.set(id, updated);
  return updated;
}

export function deleteFaq(id: string): boolean {
  return faqsById.delete(id);
}

// ---------------------------------------------------------------------------
// Journal articles
// ---------------------------------------------------------------------------

const journalById = new Map<string, JournalArticle>(journalArticlesSeed.map((a) => [a.id, structuredClone(a)]));

function isJournalSlugTaken(slug: string, excludeId?: string): boolean {
  for (const a of journalById.values()) {
    if (a.slug === slug && a.id !== excludeId) return true;
  }
  return false;
}

function uniqueJournalSlug(base: string, excludeId?: string): string {
  let slug = base || "article";
  let n = 2;
  while (isJournalSlugTaken(slug, excludeId)) {
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

/** Published articles, newest first — what /journal lists and generateStaticParams builds. */
export function getPublishedArticles(): JournalArticle[] {
  return [...journalById.values()]
    .filter((a) => a.publishStatus === "published")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

/** Resolves any article by slug, published or draft — same "preview before publishing" precedent as products/categories: the direct link still works, the listing just won't include it. */
export function getArticleBySlug(slug: string): JournalArticle | undefined {
  return [...journalById.values()].find((a) => a.slug === slug);
}

export function listAdminArticles(): JournalArticle[] {
  return [...journalById.values()].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getAdminArticleById(id: string): JournalArticle | undefined {
  return journalById.get(id);
}

export type CreateArticleInput = Omit<JournalArticle, "id" | "slug"> & { slug?: string };

export function createArticle(input: CreateArticleInput): JournalArticle {
  const id = generateId("journal");
  const slug = uniqueJournalSlug(slugify(input.slug || input.title));
  const article: JournalArticle = { ...input, id, slug };
  journalById.set(id, article);
  return article;
}

export type UpdateArticleInput = Partial<Omit<JournalArticle, "id">>;

export function updateArticle(id: string, patch: UpdateArticleInput): JournalArticle | undefined {
  const existing = journalById.get(id);
  if (!existing) return undefined;
  const slug = patch.slug && patch.slug !== existing.slug ? uniqueJournalSlug(slugify(patch.slug), id) : existing.slug;
  const updated: JournalArticle = { ...existing, ...patch, id, slug };
  journalById.set(id, updated);
  return updated;
}

export function deleteArticle(id: string): boolean {
  return journalById.delete(id);
}

// ---------------------------------------------------------------------------
// Policy pages (privacy / terms / cookie-policy)
// ---------------------------------------------------------------------------

const policies: Record<PolicyPageKey, PolicyPageContent> = structuredClone(policiesSeed);

export function getPolicyPage(key: PolicyPageKey): PolicyPageContent {
  return policies[key];
}

export function updatePolicyPage(key: PolicyPageKey, patch: Partial<PolicyPageContent>): PolicyPageContent {
  policies[key] = { ...policies[key], ...patch };
  return policies[key];
}

// ---------------------------------------------------------------------------
// Newsletter copy
// ---------------------------------------------------------------------------

let newsletter: NewsletterContent = structuredClone(newsletterSeed);

export function getNewsletterContent(): NewsletterContent {
  return newsletter;
}

export function updateNewsletterContent(patch: Partial<NewsletterContent>): NewsletterContent {
  newsletter = { ...newsletter, ...patch };
  return newsletter;
}

// ---------------------------------------------------------------------------
// Homepage section order/visibility
// ---------------------------------------------------------------------------

let homepageSections: HomepageSectionsConfig = structuredClone(homepageSectionsSeed);

export function getHomepageSectionsConfig(): HomepageSectionsConfig {
  return homepageSections;
}

export function updateHomepageSectionsConfig(patch: Partial<HomepageSectionsConfig>): HomepageSectionsConfig {
  homepageSections = { ...homepageSections, ...patch };
  return homepageSections;
}
