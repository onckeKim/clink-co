export interface QAEntry {
  id: string;
  productSlug: string;
  question: string;
  askedBy: string;
  askedAt: string;
  answer?: string;
  answeredBy?: string;
  answeredAt?: string;
  helpfulCount?: number;
}

/**
 * Seed Q&A data. In production this would be a `product_questions` table —
 * customer-asked, staff- or community-answered, with `answer` left unset
 * for a question still awaiting a reply.
 */
export const qaEntries: QAEntry[] = [
  {
    id: "qa-1",
    productSlug: "solstice-coupe-glasses",
    question: "Are these dishwasher safe, or hand wash only?",
    askedBy: "Karabo M.",
    askedAt: "2025-11-10",
    answer:
      "Hand wash is what we recommend to keep the hand-finished rim looking its best long-term, but the glass itself can survive an occasional gentle dishwasher cycle if needed.",
    answeredBy: "Clink & Co Team",
    answeredAt: "2025-11-11",
    helpfulCount: 9,
  },
  {
    id: "qa-2",
    productSlug: "solstice-coupe-glasses",
    question: "Do all four glasses in the set look identical, or does the mouth-blown process mean visible variation?",
    askedBy: "Dean R.",
    askedAt: "2025-10-22",
    answer:
      "There's always slight, deliberate variation — a faint difference in the rim finish or a small trapped bubble here and there. It's part of the mouth-blown character, not a defect, but if you want a perfectly uniform set this may not be the right style for you.",
    answeredBy: "Clink & Co Team",
    answeredAt: "2025-10-23",
    helpfulCount: 14,
  },
  {
    id: "qa-3",
    productSlug: "solstice-coupe-glasses",
    question: "What's the actual capacity to the rim versus a typical fill line?",
    askedBy: "Bianca L.",
    askedAt: "2025-12-03",
    helpfulCount: 1,
  },
  {
    id: "qa-4",
    productSlug: "hearth-dinner-plates",
    question: "Is the glaze food-safe for acidic foods like tomato-based sauces?",
    askedBy: "Ollie P.",
    askedAt: "2025-09-05",
    answer: "Yes — the stoneware glaze is fully food-safe and doesn't react with acidic foods.",
    answeredBy: "Clink & Co Team",
    answeredAt: "2025-09-06",
    helpfulCount: 5,
  },
  {
    id: "qa-5",
    productSlug: "aldine-decanter",
    question: "Will a standard 750ml wine bottle fit through the neck opening?",
    askedBy: "Simone K.",
    askedAt: "2025-08-19",
    answer: "Yes, the neck is sized for a standard 750ml bottle to pour through easily.",
    answeredBy: "Clink & Co Team",
    answeredAt: "2025-08-20",
    helpfulCount: 7,
  },
];

export function getQAForProduct(slug: string) {
  return qaEntries.filter((entry) => entry.productSlug === slug);
}
