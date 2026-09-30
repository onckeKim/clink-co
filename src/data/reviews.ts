/**
 * Reference fixtures — the actual product-page reviews live in the
 * `reviews` table (see src/lib/reviews-store.ts, wired into
 * /products/[slug]). This array still backs the homepage's
 * ReviewsCarousel (marketing content, not tied to any one product's real
 * reviews) and the local-only guest submission flow in
 * submitted-reviews-store.ts.
 */
export interface Review {
  id: string;
  customerName: string;
  location: string;
  rating: number;
  /** Optional short headline shown above the review body on the PDP reviews list. */
  title?: string;
  review: string;
  productPurchased: string;
  productSlug: string;
  verified: boolean;
  /** ISO date string — reviews on the homepage carousel predate this field, so it's optional. */
  date?: string;
  /** Customer-submitted photos, shown as a thumbnail row on the PDP. */
  images?: string[];
  /** How many visitors marked this review helpful — seeded for demo; not persisted once a visitor votes client-side. */
  helpfulCount?: number;
}

export const reviews: Review[] = [
  {
    id: "review-1",
    customerName: "Amahle N.",
    location: "Johannesburg",
    rating: 5,
    review:
      "The Reserve is the heaviest, most satisfying glass I own. My partner asks for his whisky in it specifically now, etching and all — pours just feel like an occasion.",
    productPurchased: "The Reserve",
    productSlug: "the-reserve",
    verified: true,
    date: "2025-11-02",
    helpfulCount: 14,
  },
  {
    id: "review-2",
    customerName: "Werner B.",
    location: "Cape Town",
    rating: 5,
    review:
      "Bought the Nightcap Gift Set for my brother's housewarming and he texted me a photo of it on his bar cart within the hour. Packaging alone made it feel like a much bigger gift than it was.",
    productPurchased: "The Nightcap Gift Set",
    productSlug: "the-nightcap-gift-set",
    verified: true,
    date: "2025-10-18",
    helpfulCount: 9,
  },
  {
    id: "review-3",
    customerName: "Lerato M.",
    location: "Pretoria",
    rating: 4,
    review:
      "Beautiful decanter, genuinely a statement piece on our sideboard. Docking one star only because the stopper took a couple of tries to seat properly — once it did, it's perfect.",
    productPurchased: "Aldine Decanter",
    productSlug: "aldine-decanter",
    verified: true,
    date: "2025-09-27",
    helpfulCount: 6,
  },
  {
    id: "review-4",
    customerName: "Chloe V.",
    location: "Stellenbosch",
    rating: 5,
    review:
      "We registered for the Hearth Dinner Plates for our wedding and now use them every single day — exactly the 'nice enough for guests, durable enough for real life' balance we wanted.",
    productPurchased: "Hearth Dinner Plates",
    productSlug: "hearth-dinner-plates",
    verified: true,
    date: "2025-08-14",
    helpfulCount: 11,
  },
  {
    id: "review-5",
    customerName: "Sipho K.",
    location: "Durban",
    rating: 5,
    title: "Changed how I feel about a Tuesday-night glass of MCC",
    review:
      "The Stemmed Suite changed how I feel about a Tuesday-night glass of MCC. Simple, well-balanced, and the etched date makes it feel like a little occasion every time.",
    productPurchased: "The Stemmed Suite",
    productSlug: "the-stemmed-suite",
    verified: true,
    date: "2025-12-01",
    images: ["/images/products/the-stemmed-suite-1.svg"],
    helpfulCount: 23,
  },
  {
    id: "review-6",
    customerName: "Robyn F.",
    location: "Johannesburg",
    rating: 5,
    review:
      "Ordered the Meridian shaker for my home bar and it's the first piece of barware I've owned that doesn't leak from the strainer. Small thing, makes a huge difference.",
    productPurchased: "Meridian Cocktail Shaker",
    productSlug: "meridian-cocktail-shaker",
    verified: false,
    date: "2025-11-20",
    helpfulCount: 3,
  },
  {
    id: "review-7",
    customerName: "Naledi P.",
    location: "Johannesburg",
    rating: 5,
    title: "Our go-to hosting glass now",
    review:
      "Ordered a second pair within a month because we kept reaching for these over our old flutes. Having our names etched on them makes them impossible to mix up at a dinner party.",
    productPurchased: "The Stemmed Suite",
    productSlug: "the-stemmed-suite",
    verified: true,
    date: "2025-11-24",
    helpfulCount: 17,
  },
  {
    id: "review-8",
    customerName: "Michael T.",
    location: "Cape Town",
    rating: 4,
    title: "Gorgeous, just a little delicate",
    review:
      "They're every bit as lovely as the photos. Only reason for four stars instead of five: I'd want a sturdier option for a big outdoor gathering — these feel like an indoors, careful-hands glass.",
    productPurchased: "The Stemmed Suite",
    productSlug: "the-stemmed-suite",
    verified: true,
    date: "2025-10-30",
    helpfulCount: 8,
  },
  {
    id: "review-9",
    customerName: "Zanele D.",
    location: "Durban",
    rating: 5,
    review:
      "Bought these for a wedding registry gift and ended up ordering a set for myself too. The etching is crisp and exactly where we asked for it — a genuinely nice detail you don't get with mass-produced flutes.",
    productPurchased: "The Stemmed Suite",
    productSlug: "the-stemmed-suite",
    verified: true,
    date: "2025-09-15",
    images: ["/images/products/the-stemmed-suite-2.svg"],
    helpfulCount: 12,
  },
  {
    id: "review-10",
    customerName: "Grant O.",
    location: "Pretoria",
    rating: 3,
    title: "Nice glasses, slower delivery than hoped",
    review:
      "The glasses themselves are great — my only complaint is delivery took closer to a week than the estimate suggested. Would still order again, just plan ahead if it's for a specific event.",
    productPurchased: "The Stemmed Suite",
    productSlug: "the-stemmed-suite",
    verified: true,
    date: "2025-08-02",
    helpfulCount: 5,
  },
  {
    id: "review-11",
    customerName: "Aisha R.",
    location: "Johannesburg",
    rating: 2,
    title: "One arrived chipped",
    review:
      "The glass itself is beautiful, but it arrived with a small chip on the rim. Support was responsive about a replacement, though it meant not having it in hand for the dinner I bought it for.",
    productPurchased: "The Stemmed Suite",
    productSlug: "the-stemmed-suite",
    verified: true,
    date: "2025-07-19",
    helpfulCount: 4,
  },
  {
    id: "review-12",
    customerName: "Tumi S.",
    location: "Bloemfontein",
    rating: 5,
    review:
      "Exactly as described — clean etching, nothing smudged or off-centre. Packaging was excellent, nothing arrived loose.",
    productPurchased: "The Stemmed Suite",
    productSlug: "the-stemmed-suite",
    verified: false,
    date: "2025-06-28",
    helpfulCount: 2,
  },
];

export function getReviewsForProduct(slug: string) {
  return reviews.filter((review) => review.productSlug === slug);
}

export interface ReviewStats {
  average: number;
  count: number;
  /** Count of reviews at each star rating, keyed 1–5. */
  histogram: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function getReviewStats(slug: string): ReviewStats {
  const productReviews = getReviewsForProduct(slug);
  const histogram: ReviewStats["histogram"] = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const review of productReviews) {
    const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
    histogram[bucket] += 1;
  }

  const count = productReviews.length;
  const average = count
    ? productReviews.reduce((sum, review) => sum + review.rating, 0) / count
    : 0;

  return { average, count, histogram };
}
