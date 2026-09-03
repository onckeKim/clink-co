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

/** Seed data for the content store (src/lib/admin/content-store.ts). */

export const heroSlidesSeed: HeroSlide[] = [
  {
    id: "autumn-edit",
    eyebrow: "The Autumn Edit",
    heading: "Made for moments worth raising a glass to.",
    copy: "Considered glassware, barware and tableware from Clink & Co by HEIMSIGHT — designed for the dinners that run late and the Tuesdays that deserve a little ceremony too.",
    image: "/images/hero-table.svg",
    imageAlt: "A table set with Clink & Co glassware, catching warm evening light",
    primaryCta: { label: "Shop the Collection", href: "/shop" },
    secondaryCta: { label: "Explore New Arrivals", href: "/#new-arrivals" },
    sortOrder: 0,
  },
  {
    id: "home-bar",
    eyebrow: "For the Home Bar",
    heading: "Built for the ritual, not just the pour.",
    copy: "Hand-blown rocks glasses, a monogrammed shaker, a jigger that's actually accurate — everything a home bar needs to feel considered, not cluttered.",
    image: "/images/hero-bar-cart.svg",
    imageAlt: "A styled home bar cart with Clink & Co barware",
    primaryCta: { label: "Shop the Collection", href: "/shop/barware" },
    secondaryCta: { label: "Explore New Arrivals", href: "/#new-arrivals" },
    sortOrder: 1,
  },
  {
    id: "gifting",
    eyebrow: "Gifting",
    heading: "A gift that says more than the card does.",
    copy: "Boxed, ribboned and ready to give — our gift sets pair the pieces people actually use, with a handwritten note added at checkout.",
    image: "/images/hero-gifting.svg",
    imageAlt: "A Clink & Co gift set boxed and ribboned",
    primaryCta: { label: "Shop the Collection", href: "/shop/gift-sets" },
    secondaryCta: { label: "Explore New Arrivals", href: "/#new-arrivals" },
    sortOrder: 2,
  },
];

export const bannersSeed: PromoBanner[] = [
  {
    id: "banner-launch",
    message: "Free delivery on orders over R500 — no code needed.",
    href: "/shop",
    active: true,
  },
];

export const editorialSeed: EditorialSection = {
  eyebrow: "Editorial",
  title: "The Art of Hosting Well",
  description:
    "Hosting well isn't about grand gestures — it's the right glass in hand, a table that feels considered without feeling fussy, and pieces sturdy enough to survive the actual evening. We design for that: the quiet, repeatable moments of entertaining, not just the highlight reel.",
  ctaLabel: "Shop Entertaining",
  ctaHref: "/shop",
  image: "/images/editorial-hosting.svg",
  imageAlt: "A table set for entertaining with Clink & Co glassware and tableware",
};

export const aboutPageSeed: AboutPageContent = {
  heroEyebrow: "Our Story",
  heroTitle: "Made for moments worth raising a glass to.",
  heroDescription:
    "Clink & Co by HEIMSIGHT started with a simple question: why does the glassware people actually reach for every day get so little thought? We set out to make pieces considered enough for the occasion and sturdy enough for a Tuesday.",
  heroImage: "/images/hero-table.svg",
  heroImageAlt: "A table set with Clink & Co glassware",
  sections: [
    {
      heading: "Where it began",
      body: "HEIMSIGHT was founded on the belief that the objects we use every day deserve the same care as the ones we save for best. Clink & Co is our answer for the table — glassware, barware and tableware designed to be used, not just admired.",
    },
    {
      heading: "How we make it",
      body: "Every piece is developed with small-batch makers who share our obsession with weight, balance and finish. We test for the everyday: dishwasher cycles, a crowded dinner table, the odd knock against the sink — not just the studio photograph.",
    },
    {
      heading: "What we believe",
      body: "Hosting shouldn't require a special occasion. We design for the quiet, repeatable moments of entertaining — the Tuesday dinner, the impromptu cocktail, the gift that gets used — so raising a glass never needs an excuse.",
    },
  ],
};

export const faqsSeed: FaqEntry[] = [
  {
    id: "faq-shipping-time",
    question: "How long does delivery take?",
    answer: "Most orders ship within 2–4 business days and arrive within 3–7 business days depending on your location within South Africa.",
    category: "Shipping",
    sortOrder: 0,
  },
  {
    id: "faq-free-shipping",
    question: "Is delivery free?",
    answer: "Delivery is free on all orders over R500. Below that threshold, a flat delivery fee applies at checkout based on your chosen delivery method.",
    category: "Shipping",
    sortOrder: 1,
  },
  {
    id: "faq-returns-window",
    question: "What's your return policy?",
    answer: "You can return unused items in their original packaging within 30 days of delivery for a full refund. Start a return from your account's order history.",
    category: "Returns",
    sortOrder: 0,
  },
  {
    id: "faq-damaged-item",
    question: "My order arrived damaged — what do I do?",
    answer: "We're sorry to hear that. Contact us within 48 hours of delivery with a photo of the damage and we'll arrange a replacement or refund at no cost to you.",
    category: "Returns",
    sortOrder: 1,
  },
  {
    id: "faq-dishwasher-safe",
    question: "Is your glassware dishwasher safe?",
    answer: "Most pieces are dishwasher safe on a gentle cycle — check the care instructions on each product page. Hand-finished and gold-rimmed pieces are best hand-washed to protect the finish.",
    category: "Product Care",
    sortOrder: 0,
  },
  {
    id: "faq-gift-wrap",
    question: "Can I add gift wrapping?",
    answer: "Yes — complimentary gift wrapping and a handwritten note are available at checkout on every order.",
    category: "Orders",
    sortOrder: 0,
  },
  {
    id: "faq-change-order",
    question: "Can I change or cancel my order after placing it?",
    answer: "Contact us as soon as possible — we can usually amend or cancel an order before it's packed for dispatch, but can't guarantee changes once it's on its way.",
    category: "Orders",
    sortOrder: 1,
  },
];

export const journalArticlesSeed: JournalArticle[] = [
  {
    id: "journal-hosting-101",
    slug: "the-art-of-hosting-well",
    title: "The Art of Hosting Well",
    excerpt: "Hosting well isn't about grand gestures — it's the small, repeatable details that make a table feel considered.",
    body: [
      "Hosting well isn't about grand gestures — it's the right glass in hand, a table that feels considered without feeling fussy, and pieces sturdy enough to survive the actual evening.",
      "We design for that: the quiet, repeatable moments of entertaining, not just the highlight reel. A weeknight dinner deserves the same care as a dinner party, just with less ceremony.",
      "Start with glassware that does double duty — a coupe that works for a cocktail and a dessert wine, a tumbler that's equally at home with water or whisky. Fewer, better pieces beat a cupboard full of single-use glassware.",
    ],
    coverImage: "/images/editorial-hosting.svg",
    coverImageAlt: "A table set for entertaining with Clink & Co glassware and tableware",
    author: "Clink & Co Editorial",
    publishedAt: "2025-03-04",
    publishStatus: "published",
  },
  {
    id: "journal-glass-care",
    slug: "how-to-care-for-hand-blown-glassware",
    title: "How to Care for Hand-Blown Glassware",
    excerpt: "A few habits that keep hand-blown glassware looking its best for years, not just its first dinner party.",
    body: [
      "Hand-blown glassware rewards a little extra care — not because it's fragile, but because it's worth keeping around for years.",
      "Hand-wash gold-rimmed or hand-finished pieces in warm, not hot, water with a soft cloth. Extreme temperature swings are the main cause of cracking, so let a glass warm to room temperature before it meets hot water.",
      "Store stemware upright rather than resting on the rim, and give each piece a little breathing room on the shelf so they're not knocking together every time the cupboard door opens.",
    ],
    coverImage: "/images/lifestyle-glass.svg",
    coverImageAlt: "Close-up of hand-blown glassware catching the light",
    author: "Clink & Co Editorial",
    publishedAt: "2025-05-12",
    publishStatus: "published",
  },
  {
    id: "journal-gift-guide",
    slug: "a-gift-guide-for-the-host-in-your-life",
    title: "A Gift Guide for the Host in Your Life",
    excerpt: "Boxed, ribboned and ready to give — our edit of gifts for the person who's always setting the table for someone else.",
    body: [
      "Buying for the host in your life is easy once you stop trying to be original and start paying attention to what they actually reach for.",
      "A monogrammed shaker or a beautifully weighted jigger tells them you noticed the home bar they've quietly been building. A boxed set of coupes says you trust them to host again soon.",
      "Every gift set ships boxed and ribboned, with a handwritten note available at checkout — so the presentation does some of the work for you.",
    ],
    coverImage: "/images/lifestyle-gift.svg",
    coverImageAlt: "A Clink & Co gift set boxed and ribboned",
    author: "Clink & Co Editorial",
    publishedAt: "2025-08-20",
    publishStatus: "published",
  },
];

const genericUpdatedAt = "2025-01-01";

export const policiesSeed: Record<PolicyPageKey, PolicyPageContent> = {
  privacy: {
    title: "Privacy Policy",
    updatedAt: genericUpdatedAt,
    intro:
      "This policy explains what personal information Clink & Co by HEIMSIGHT collects, how we use it, and the choices you have. By using our site, you agree to the practices described here.",
    sections: [
      {
        heading: "Information we collect",
        body: "We collect the information you give us directly — your name, email, delivery address and order history — along with basic usage data (pages visited, device type) to keep the site working well.",
      },
      {
        heading: "How we use it",
        body: "We use your information to process orders, provide customer support, and — with your consent — send marketing communications. We never sell your personal information to third parties.",
      },
      {
        heading: "Your choices",
        body: "You can update your marketing preferences at any time from your account settings, or contact us to request a copy or deletion of your personal information.",
      },
    ],
  },
  terms: {
    title: "Terms of Service",
    updatedAt: genericUpdatedAt,
    intro:
      "These terms govern your use of the Clink & Co by HEIMSIGHT website and your purchases from us. Please read them carefully before placing an order.",
    sections: [
      {
        heading: "Orders and pricing",
        body: "All prices are shown in South African Rand (ZAR) and include applicable taxes unless stated otherwise. We reserve the right to correct pricing errors and to cancel orders placed at an incorrect price.",
      },
      {
        heading: "Delivery",
        body: "Delivery timeframes shown at checkout are estimates, not guarantees. Risk of loss passes to you once an order is delivered to the address provided at checkout.",
      },
      {
        heading: "Returns",
        body: "Unused items in their original packaging may be returned within 30 days of delivery for a full refund, in line with our returns policy.",
      },
    ],
  },
  "cookie-policy": {
    title: "Cookie Policy",
    updatedAt: genericUpdatedAt,
    intro:
      "We use cookies and similar technologies to keep the site working, remember your preferences, and understand how the site is used.",
    sections: [
      {
        heading: "Essential cookies",
        body: "These cookies are required for core functionality like keeping items in your cart and keeping you signed in — the site can't function properly without them.",
      },
      {
        heading: "Analytics cookies",
        body: "With your consent, we use analytics cookies to understand how visitors use the site, so we can improve it over time.",
      },
      {
        heading: "Managing your preferences",
        body: "You can update your cookie preferences at any time using the cookie settings link in the site footer.",
      },
    ],
  },
};

export const newsletterSeed: NewsletterContent = {
  heading: "Join the list",
  description: "New arrivals, restocks and the occasional invitation — no more than twice a month.",
};

export const homepageSectionsSeed: HomepageSectionsConfig = {
  order: [
    "hero",
    "feature-strip",
    "category-showcase",
    "editorial",
    "bestsellers",
    "new-arrivals",
    "curated-collections",
    "brand-story",
    "reviews",
    "social-gallery",
    "newsletter",
    "recently-viewed",
  ],
  hidden: [],
};
