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
  // Ordering
  {
    id: "faq-place-order",
    question: "How do I place an order?",
    answer: "Add items to your cart, then head to checkout — you can pay as a guest or sign in to your account. Once payment is confirmed, you'll receive an order confirmation email straight away.",
    category: "Ordering",
    sortOrder: 0,
  },
  {
    id: "faq-change-order",
    question: "Can I change or cancel my order after placing it?",
    answer: "Contact us as soon as possible — we can usually amend or cancel an order before it's packed for dispatch, but can't guarantee changes once it's on its way.",
    category: "Ordering",
    sortOrder: 1,
  },
  {
    id: "faq-order-confirmation",
    question: "I didn't receive an order confirmation email — what should I do?",
    answer: "Check your spam or promotions folder first. If it's still not there, contact us with your name and approximate order time and we'll confirm your order and resend the email.",
    category: "Ordering",
    sortOrder: 2,
  },
  {
    id: "faq-gift-wrap",
    question: "Can I add gift wrapping?",
    answer: "Yes — complimentary gift wrapping and a handwritten note are available at checkout on every order.",
    category: "Ordering",
    sortOrder: 3,
  },

  // Payments
  {
    id: "faq-payment-methods",
    question: "What payment methods do you accept?",
    answer: "We accept major credit and debit cards, as well as popular South African payment methods including instant EFT — all available at checkout, processed securely by our payment partners.",
    category: "Payments",
    sortOrder: 0,
  },
  {
    id: "faq-payment-security",
    question: "Is it safe to pay on your site?",
    answer: "Yes — all payments are processed through PCI-compliant payment gateways. We never see or store your full card details on our servers.",
    category: "Payments",
    sortOrder: 1,
  },
  {
    id: "faq-payment-failed",
    question: "My payment failed — was I charged?",
    answer: "A failed payment usually means no funds left your account, but if you're unsure, check with your bank or contact us with your order number and we'll confirm the status for you.",
    category: "Payments",
    sortOrder: 2,
  },
  {
    id: "faq-invoice",
    question: "Can I get an invoice or receipt for my order?",
    answer: "Yes — a tax invoice is available for every order from your account's order history, or attached to your confirmation email.",
    category: "Payments",
    sortOrder: 3,
  },

  // Delivery
  {
    id: "faq-shipping-time",
    question: "How long does delivery take?",
    answer: "Most orders ship within 1–2 business days and arrive within 2–7 business days depending on your delivery zone within South Africa. See our Delivery Information page for full details by area.",
    category: "Delivery",
    sortOrder: 0,
  },
  {
    id: "faq-free-shipping",
    question: "Is delivery free?",
    answer: "Delivery is free on all orders over R500. Below that threshold, a delivery fee applies at checkout based on your chosen method and delivery zone.",
    category: "Delivery",
    sortOrder: 1,
  },
  {
    id: "faq-track-order",
    question: "How do I track my order?",
    answer: "Once your order ships, we'll email you tracking details. You can also check delivery status any time from your account's order history.",
    category: "Delivery",
    sortOrder: 2,
  },
  {
    id: "faq-delivery-areas",
    question: "Do you deliver across all of South Africa?",
    answer: "Yes — we deliver nationwide. Delivery fees and timing vary slightly by zone (metro, regional or outlying); full details are on our Delivery Information page.",
    category: "Delivery",
    sortOrder: 3,
  },

  // Returns
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
    id: "faq-refund-timing",
    question: "How long do refunds take?",
    answer: "Once we've received and inspected your return, refunds are processed to your original payment method within 5–7 business days.",
    category: "Returns",
    sortOrder: 2,
  },
  {
    id: "faq-return-exclusions",
    question: "Are any items excluded from returns?",
    answer: "Gift cards, personalised or engraved items, and items marked as final sale can't be returned. See our Returns page for the full list of exclusions.",
    category: "Returns",
    sortOrder: 3,
  },

  // Product Care
  {
    id: "faq-dishwasher-safe",
    question: "Is your glassware dishwasher safe?",
    answer: "Most pieces are dishwasher safe on a gentle cycle — check the care instructions on each product page. Hand-finished and gold-rimmed pieces are best hand-washed to protect the finish.",
    category: "Product Care",
    sortOrder: 0,
  },
  {
    id: "faq-glass-storage",
    question: "What's the best way to store stemware?",
    answer: "Store stemware upright rather than resting on the rim, with a little breathing room between pieces so they're not knocking together on the shelf.",
    category: "Product Care",
    sortOrder: 1,
  },
  {
    id: "faq-glass-cracking",
    question: "Why did my glass crack in the dishwasher?",
    answer: "Extreme temperature swings are the most common cause — let a glass warm to room temperature before it meets hot water, and avoid stacking glassware tightly in the dishwasher.",
    category: "Product Care",
    sortOrder: 2,
  },

  // Gift Purchases
  {
    id: "faq-gift-for-someone-else",
    question: "Can I send an order directly to someone else as a gift?",
    answer: "Yes — simply enter their address as the delivery address at checkout. Add a gift note in the notes field and we'll leave pricing off the packing slip.",
    category: "Gift Purchases",
    sortOrder: 0,
  },
  {
    id: "faq-gift-sets",
    question: "Do you sell ready-made gift sets?",
    answer: "Yes — our gift sets pair pieces people actually use, boxed and ribboned and ready to give. Browse them under Shop → Gift Sets, or see our Gift Guide for curated picks by occasion and budget.",
    category: "Gift Purchases",
    sortOrder: 1,
  },
  {
    id: "faq-gift-receipt",
    question: "Can I include a gift receipt without prices?",
    answer: "Yes — select the gift wrapping option at checkout and we'll include a price-free packing slip along with your handwritten note.",
    category: "Gift Purchases",
    sortOrder: 2,
  },

  // Customer Accounts
  {
    id: "faq-create-account",
    question: "Do I need an account to order?",
    answer: "No — you can check out as a guest. Creating an account lets you track orders, save addresses and build a wishlist, and you can always create one from your guest order confirmation.",
    category: "Customer Accounts",
    sortOrder: 0,
  },
  {
    id: "faq-reset-password",
    question: "How do I reset my password?",
    answer: "Select \"Forgot password\" on the sign-in page and we'll email you a secure link to set a new one.",
    category: "Customer Accounts",
    sortOrder: 1,
  },
  {
    id: "faq-update-details",
    question: "How do I update my account details or addresses?",
    answer: "Sign in and go to your account dashboard — you can update your profile, saved addresses and marketing preferences at any time.",
    category: "Customer Accounts",
    sortOrder: 2,
  },

  // Discount Codes
  {
    id: "faq-apply-discount",
    question: "How do I apply a discount code?",
    answer: "Enter your code in the promo code field at checkout, before you pay, and the discount will be reflected in your order total.",
    category: "Discount Codes",
    sortOrder: 0,
  },
  {
    id: "faq-discount-not-working",
    question: "My discount code isn't working — why?",
    answer: "Double-check the code hasn't expired and that your order meets any minimum spend or product requirements. Some codes also can't be combined with other offers.",
    category: "Discount Codes",
    sortOrder: 1,
  },
  {
    id: "faq-stack-discounts",
    question: "Can I use more than one discount code on an order?",
    answer: "Generally only one promo code can be applied per order, though some automatic promotions may apply alongside it — the checkout total always reflects the best available price.",
    category: "Discount Codes",
    sortOrder: 2,
  },

  // Product Availability
  {
    id: "faq-out-of-stock",
    question: "An item I want is out of stock — will it come back?",
    answer: "Many of our pieces are restocked regularly. Use the \"notify me\" option on the product page and we'll email you as soon as it's back.",
    category: "Product Availability",
    sortOrder: 0,
  },
  {
    id: "faq-discontinued",
    question: "What does it mean if a product is marked discontinued?",
    answer: "A discontinued item won't be restocked, usually because we've retired that design. Related or similar pieces are often suggested on the product page.",
    category: "Product Availability",
    sortOrder: 1,
  },
  {
    id: "faq-preorder",
    question: "Can I pre-order an item that's coming soon?",
    answer: "Pre-orders aren't currently supported — new arrivals go live on the site as soon as they're in stock, and you can sign up to our newsletter to hear first.",
    category: "Product Availability",
    sortOrder: 2,
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
    category: "Entertaining",
    tags: ["hosting", "table styling", "glassware"],
    featured: true,
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
    category: "Product Care",
    tags: ["glassware", "care guide"],
    featured: false,
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
    category: "Gifting",
    tags: ["gifting", "gift sets", "hosting"],
    featured: false,
  },
  {
    id: "journal-home-bar",
    slug: "how-to-build-a-timeless-home-bar",
    title: "How to Build a Timeless Home Bar",
    excerpt: "You don't need a bar cart full of gadgets — just a handful of pieces that do their job well, and look good doing it.",
    body: [
      "A good home bar isn't built in one trip — it's assembled slowly, around the drinks you actually make. Start with the basics: a mixing glass, a jigger that measures accurately, a bar spoon with enough heft to feel right in hand, and a shaker for anything that needs real agitation.",
      "Glassware comes next, and fewer, better pieces beat a cupboard of single-use glasses. A set of rocks glasses and a set of coupes will cover most classic cocktails; add a highball if you're often mixing longer drinks.",
      "Resist the urge to buy every gadget at once. A muddler and a citrus press are worth having; most of the rest is nice-to-have, not need-to-have. Build the bar around what you actually pour, and it'll stay timeless instead of trend-driven.",
      "Finally, give it a home — a tray, a cart, or even a single shelf — so the ritual of making a drink feels considered rather than improvised.",
    ],
    coverImage: "/images/hero-bar-cart.svg",
    coverImageAlt: "A styled home bar cart with Clink & Co barware",
    author: "Clink & Co Editorial",
    publishedAt: "2025-09-02",
    publishStatus: "published",
    category: "Home Bar",
    tags: ["home bar", "barware", "cocktails"],
    featured: false,
  },
  {
    id: "journal-glass-guide",
    slug: "choosing-the-right-glass-for-every-drink",
    title: "Choosing the Right Glass for Every Drink",
    excerpt: "The right glass shapes how a drink smells, tastes and feels in hand — here's a quick guide to picking the right one.",
    body: [
      "Glass shape isn't just aesthetics — the width of the rim, the shape of the bowl and the height of the stem all change how a drink presents itself. A wide bowl opens up aroma, which is why red wine glasses are broader than white wine glasses.",
      "For spirits, a rocks glass gives you room for ice and a wide mouth for aroma; a nosing glass narrows toward the top to concentrate it further, which is why it's the choice for tasting whisky neat.",
      "Cocktails split roughly into two camps: served up in a coupe or martini glass to keep the drink cold without dilution from your hand, or served over ice in a rocks or highball glass depending on how long the drink is.",
      "When in doubt, a good all-purpose tumbler and a classic coupe will see you through most situations — build out from there as you learn what you actually reach for.",
    ],
    coverImage: "/images/lifestyle-glass.svg",
    coverImageAlt: "A row of different glass styles catching the light",
    author: "Clink & Co Editorial",
    publishedAt: "2025-07-15",
    publishStatus: "published",
    category: "Home Bar",
    tags: ["glassware", "cocktails", "buying guide"],
    featured: false,
  },
  {
    id: "journal-table-styling",
    slug: "effortless-table-styling-for-small-gatherings",
    title: "Effortless Table Styling for Small Gatherings",
    excerpt: "You don't need a full dinner-party production to set a table that feels considered — a few habits go a long way.",
    body: [
      "The easiest way to make a table feel styled rather than just set is to vary height and texture — a low bowl of fruit or flowers, taller glassware, and a table runner or linen napkins instead of paper.",
      "Mismatched place settings, done deliberately, read as collected rather than chaotic — pair a patterned side plate with a plain dinner plate, or mix two glassware styles across the table.",
      "Light matters more than most people think. A couple of low candles do more for the mood of a small gathering than any centrepiece — just keep them below eye line so guests can still see each other.",
      "Finally, don't over-style. Leave room on the table for the food and the conversation — the best-styled tables still look like someone is about to sit down and eat, not admire it from a distance.",
    ],
    coverImage: "/images/editorial-hosting.svg",
    coverImageAlt: "A small table set for an intimate dinner gathering",
    author: "Clink & Co Editorial",
    publishedAt: "2025-06-10",
    publishStatus: "published",
    category: "Entertaining",
    tags: ["table styling", "hosting", "entertaining"],
    featured: false,
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
  "delivery-policy": {
    title: "Delivery Policy",
    updatedAt: genericUpdatedAt,
    intro:
      "[Placeholder legal copy] This delivery policy outlines the areas we deliver to, expected timeframes and fees for orders placed with Clink & Co by HEIMSIGHT. It should be read alongside our Delivery Information page.",
    sections: [
      {
        heading: "Delivery areas and timeframes",
        body: "[Placeholder] We deliver to addresses across South Africa. Estimated delivery timeframes are provided at checkout and on our Delivery Information page and are indicative only, not guaranteed delivery dates.",
      },
      {
        heading: "Delivery fees",
        body: "[Placeholder] Delivery fees are calculated at checkout based on delivery zone and chosen method, and orders over the advertised free-delivery threshold qualify for free standard delivery.",
      },
      {
        heading: "Failed or delayed delivery",
        body: "[Placeholder] Where a delivery is delayed, misdirected due to an incorrect address supplied at checkout, or cannot be completed after reasonable attempts, additional fees may apply for re-delivery. Contact our support team for assistance.",
      },
    ],
  },
  "returns-policy": {
    title: "Returns and Refund Policy",
    updatedAt: genericUpdatedAt,
    intro:
      "[Placeholder legal copy] This policy sets out the terms on which Clink & Co by HEIMSIGHT accepts returns and processes refunds, in addition to any statutory rights you have under South African consumer protection law.",
    sections: [
      {
        heading: "Return eligibility",
        body: "[Placeholder] Items may be returned within the return window stated on our Returns page, provided they are unused, in their original packaging, and accompanied by proof of purchase.",
      },
      {
        heading: "Refunds",
        body: "[Placeholder] Approved refunds are issued to the original payment method within the timeframe stated on our Returns page. Delivery fees are refunded only where the return is due to our error or a damaged or incorrect item.",
      },
      {
        heading: "Consumer Protection Act",
        body: "[Placeholder] Nothing in this policy limits any right you may have under the Consumer Protection Act 68 of 2008 or other applicable South African legislation.",
      },
    ],
  },
  "payment-policy": {
    title: "Payment Policy",
    updatedAt: genericUpdatedAt,
    intro:
      "[Placeholder legal copy] This payment policy describes the payment methods we accept and how payment information is processed and secured when you shop with Clink & Co by HEIMSIGHT.",
    sections: [
      {
        heading: "Accepted payment methods",
        body: "[Placeholder] We accept major credit and debit cards and other payment methods shown at checkout, processed through PCI-DSS-compliant third-party payment gateways.",
      },
      {
        heading: "Security",
        body: "[Placeholder] We do not store your full card details on our servers. All payment data is transmitted securely and handled in accordance with our payment providers' security standards.",
      },
      {
        heading: "Currency and pricing",
        body: "[Placeholder] All prices are displayed and charged in South African Rand (ZAR) and are inclusive of VAT at the applicable rate unless stated otherwise.",
      },
    ],
  },
  disclaimer: {
    title: "Website Disclaimer",
    updatedAt: genericUpdatedAt,
    intro:
      "[Placeholder legal copy] The following disclaimer applies to your use of the Clink & Co by HEIMSIGHT website. By using this site, you accept this disclaimer in full.",
    sections: [
      {
        heading: "No professional advice",
        body: "[Placeholder] Content on this website, including our Journal, is provided for general informational purposes only and does not constitute professional advice of any kind.",
      },
      {
        heading: "Accuracy of information",
        body: "[Placeholder] While we try to keep product, pricing and availability information up to date, we make no warranties about the completeness or accuracy of the information on this site.",
      },
      {
        heading: "Limitation of liability",
        body: "[Placeholder] To the fullest extent permitted by law, Clink & Co by HEIMSIGHT will not be liable for any indirect or consequential loss arising from the use of this website.",
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
