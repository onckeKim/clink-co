import type { Product } from "@/types/product";

/**
 * Temporary seed data used to build and preview the storefront UI.
 * Once Supabase is connected, products should be fetched from the
 * `products` table instead — see src/lib/supabase. Prices are in ZAR
 * (South African Rand), rounded to whole Rand per local retail convention.
 */
export const products: Product[] = [
  {
    id: "prod-solstice-coupe",
    slug: "solstice-coupe-glasses",
    name: "Solstice Coupe Glasses",
    tagline: "Set of 4, hand-finished rims",
    description:
      "A wide, shallow bowl balanced on a slender stem — the Solstice Coupe brings a soft amber cast to sparkling wine and classic cocktails alike. Each glass is mouth-blown and hand-finished, so faint variations in the rim are a mark of the process, not a flaw.",
    price: 1450,
    currency: "ZAR",
    images: [
      "/images/products/solstice-coupe-glasses-1.svg",
      "/images/products/solstice-coupe-glasses-2.svg",
    ],
    categorySlug: "glassware",
    material: "Hand-blown glass",
    setSize: "Set of 4",
    inStock: true,
    badges: ["Bestseller"],
    rating: 4.8,
    reviewCount: 212,
  },
  {
    id: "prod-harbor-rocks",
    slug: "harbor-rocks-glasses",
    name: "Harbor Rocks Glasses",
    tagline: "Set of 4, heavyweight base",
    description:
      "Wide enough for a single oversized cube, weighted enough to feel substantial in hand. The Harbor Rocks Glass is our most requested piece for whisky, negronis and quiet nights in.",
    price: 1250,
    currency: "ZAR",
    images: [
      "/images/products/harbor-rocks-glasses-1.svg",
      "/images/products/harbor-rocks-glasses-2.svg",
    ],
    categorySlug: "glassware",
    material: "Lead-free crystal",
    setSize: "Set of 4",
    inStock: true,
    badges: ["Bestseller"],
    rating: 4.9,
    reviewCount: 341,
  },
  {
    id: "prod-meridian-shaker",
    slug: "meridian-cocktail-shaker",
    name: "Meridian Cocktail Shaker",
    tagline: "Brushed stainless, 24oz",
    description:
      "A three-piece Cobbler shaker with a built-in strainer and a cap that doubles as a jigger. Brushed to resist fingerprints, weighted to shake evenly, and finished with the Clink & Co monogram on the base.",
    price: 1750,
    currency: "ZAR",
    images: [
      "/images/products/meridian-cocktail-shaker-1.svg",
      "/images/products/meridian-cocktail-shaker-2.svg",
    ],
    categorySlug: "barware",
    material: "Brushed stainless steel",
    capacity: "24 oz",
    inStock: true,
    badges: ["New"],
    rating: 4.7,
    reviewCount: 88,
  },
  {
    id: "prod-aldine-decanter",
    slug: "aldine-decanter",
    name: "Aldine Decanter",
    tagline: "Hand-blown, 1L capacity",
    description:
      "A sculptural silhouette that catches the light from every angle. The Aldine Decanter is generous enough for a full bottle and a splash, with a stopper ground to seal tight.",
    price: 2650,
    currency: "ZAR",
    images: [
      "/images/products/aldine-decanter-1.svg",
      "/images/products/aldine-decanter-2.svg",
    ],
    categorySlug: "serveware",
    material: "Hand-blown glass",
    capacity: "1 L",
    inStock: true,
    badges: ["Bestseller"],
    rating: 4.9,
    reviewCount: 156,
  },
  {
    id: "prod-wilder-napkins",
    slug: "wilder-linen-napkins",
    name: "Wilder Linen Napkins",
    tagline: "Set of 6, stonewashed",
    description:
      "Stonewashed European linen that softens with every use. Generously sized, finished with a mitred hem, and available in three seasonal shades of our warm neutral palette.",
    price: 980,
    currency: "ZAR",
    images: [
      "/images/products/wilder-linen-napkins-1.svg",
      "/images/products/wilder-linen-napkins-2.svg",
    ],
    categorySlug: "tableware",
    material: "100% European linen",
    setSize: "Set of 6",
    inStock: true,
    variants: [
      { id: "ivory", label: "Ivory", swatch: "#F7F5F0" },
      { id: "sage", label: "Sage", swatch: "#8A9683" },
      { id: "clay", label: "Clay", swatch: "#B08A6B" },
    ],
    rating: 4.6,
    reviewCount: 74,
  },
  {
    id: "prod-hearth-dinner-plates",
    slug: "hearth-dinner-plates",
    name: "Hearth Dinner Plates",
    tagline: "Set of 4, stoneware",
    description:
      "Thrown in stoneware and glazed by hand, so no two plates catch the light quite the same way. Dishwasher and microwave safe, despite the handmade finish.",
    price: 1550,
    compareAtPrice: 1950,
    currency: "ZAR",
    images: [
      "/images/products/hearth-dinner-plates-1.svg",
      "/images/products/hearth-dinner-plates-2.svg",
    ],
    categorySlug: "tableware",
    material: "Glazed stoneware",
    setSize: "Set of 4",
    inStock: true,
    badges: ["Bestseller"],
    rating: 4.8,
    reviewCount: 199,
  },
  {
    id: "prod-nightcap-gift-set",
    slug: "the-nightcap-gift-set",
    name: "The Nightcap Gift Set",
    tagline: "Rocks glasses, jigger & bitters tray",
    description:
      "Everything a first cocktail cabinet needs, boxed together in signature Clink & Co packaging: two Harbor Rocks glasses, a brass jigger, and a marble bitters tray. Arrives ribboned, ready to give.",
    price: 2450,
    currency: "ZAR",
    images: [
      "/images/products/the-nightcap-gift-set-1.svg",
      "/images/products/the-nightcap-gift-set-2.svg",
    ],
    categorySlug: "gift-sets",
    setSize: "3-piece set",
    inStock: true,
    badges: ["Gift Edit", "Bestseller"],
    rating: 5,
    reviewCount: 61,
  },
  {
    id: "prod-ember-taper-candles",
    slug: "ember-taper-candles",
    name: "Ember Taper Candles",
    tagline: "Set of 6, unscented beeswax",
    description:
      "Slow-burning beeswax tapers in a warm honey hue, sized to fit standard holders. Unscented, so they never compete with what's on the table.",
    price: 580,
    currency: "ZAR",
    images: [
      "/images/products/ember-taper-candles-1.svg",
      "/images/products/ember-taper-candles-2.svg",
    ],
    categorySlug: "accessories",
    material: "Beeswax",
    setSize: "Set of 6",
    inStock: true,
    rating: 4.7,
    reviewCount: 43,
  },
  {
    id: "prod-marble-coasters",
    slug: "stonewell-marble-coasters",
    name: "Stonewell Marble Coasters",
    tagline: "Set of 4, cork-backed",
    description:
      "Honed marble with a soft cork underside, so surfaces stay protected without a sound. Each set is cut from natural stone, meaning subtle veining varies piece to piece.",
    price: 780,
    currency: "ZAR",
    images: [
      "/images/products/stonewell-marble-coasters-1.svg",
      "/images/products/stonewell-marble-coasters-2.svg",
    ],
    categorySlug: "accessories",
    material: "Honed marble, cork backing",
    setSize: "Set of 4",
    inStock: true,
    rating: 4.6,
    reviewCount: 97,
  },
  {
    id: "prod-tidewater-ice-bucket",
    slug: "tidewater-ice-bucket",
    name: "Tidewater Ice Bucket",
    tagline: "Brass-lined, with tongs",
    description:
      "A double-walled ice bucket lined in brushed brass, keeping ice cold and hands dry. Comes with matching tongs that rest neatly on the rim.",
    price: 1980,
    currency: "ZAR",
    images: [
      "/images/products/tidewater-ice-bucket-1.svg",
      "/images/products/tidewater-ice-bucket-2.svg",
    ],
    categorySlug: "serveware",
    material: "Brushed brass, powder-coated steel",
    inStock: false,
    rating: 4.9,
    reviewCount: 52,
  },
  {
    id: "prod-lowland-wine-glasses",
    slug: "lowland-wine-glasses",
    name: "Lowland Wine Glasses",
    tagline: "Set of 4, all-purpose bowl",
    description:
      "A single, generous bowl shape designed to work equally well for red, white or orange wine — one glass style for every bottle you open.",
    price: 1350,
    currency: "ZAR",
    images: [
      "/images/products/lowland-wine-glasses-1.svg",
      "/images/products/lowland-wine-glasses-2.svg",
    ],
    categorySlug: "glassware",
    material: "Lead-free crystal",
    setSize: "Set of 4",
    inStock: true,
    badges: ["Bestseller"],
    rating: 4.8,
    reviewCount: 128,
  },
  {
    id: "prod-almanac-jigger",
    slug: "almanac-brass-jigger",
    name: "Almanac Brass Jigger",
    tagline: "1oz / 2oz, solid brass",
    description:
      "A solid brass jigger with etched measurement lines at the half-ounce, sized for both the classic pour and the generous one.",
    price: 520,
    currency: "ZAR",
    images: [
      "/images/products/almanac-brass-jigger-1.svg",
      "/images/products/almanac-brass-jigger-2.svg",
    ],
    categorySlug: "barware",
    material: "Solid brass",
    capacity: "1 oz / 2 oz",
    inStock: true,
    badges: ["New"],
    rating: 4.7,
    reviewCount: 39,
  },
  {
    id: "prod-gathering-serving-tray",
    slug: "gathering-serving-tray",
    name: "Gathering Serving Tray",
    tagline: "Oak & brass, 20-inch",
    description:
      "Solid oak with brass handles, sized to carry a full round of drinks across the room without a second trip. Finished with a food-safe oil that deepens the grain over time.",
    price: 1650,
    currency: "ZAR",
    images: [
      "/images/products/gathering-serving-tray-1.svg",
      "/images/products/gathering-serving-tray-2.svg",
    ],
    categorySlug: "serveware",
    material: "Solid oak, brass hardware",
    inStock: true,
    rating: 4.8,
    reviewCount: 66,
  },
  {
    id: "prod-toast-champagne-flutes",
    slug: "toast-champagne-flutes",
    name: "Toast Champagne Flutes",
    tagline: "Set of 4, fluted stem",
    description:
      "A fine, fluted stem holds the glass steady while a tapered bowl keeps every pour lively. Made for the toasts that matter and the Tuesdays that deserve one too.",
    price: 1380,
    currency: "ZAR",
    images: [
      "/images/products/toast-champagne-flutes-1.svg",
      "/images/products/toast-champagne-flutes-2.svg",
    ],
    categorySlug: "glassware",
    material: "Hand-blown glass",
    setSize: "Set of 4",
    inStock: true,
    badges: ["Bestseller"],
    rating: 4.9,
    reviewCount: 174,
  },
  {
    id: "prod-meadow-stem-wine-glasses",
    slug: "meadow-stem-wine-glasses",
    name: "Meadow Stem Wine Glasses",
    tagline: "Set of 4, tinted crystal",
    description:
      "A long, slender stem and a softly tinted bowl give the Meadow glass its quiet character on the table — equally at home holding a Tuesday rosé or a Sunday Burgundy.",
    price: 1450,
    currency: "ZAR",
    images: [
      "/images/products/harbor-rocks-glasses-1.svg",
      "/images/products/harbor-rocks-glasses-2.svg",
    ],
    categorySlug: "glassware",
    material: "Tinted crystal",
    setSize: "Set of 4",
    inStock: true,
    badges: ["New"],
    variants: [
      { id: "clear", label: "Clear", swatch: "#F7F5F0" },
      { id: "smoke", label: "Smoke Grey", swatch: "#746C62" },
    ],
    rating: 4.6,
    reviewCount: 21,
  },
  {
    id: "prod-ridgeline-whisky-tumblers",
    slug: "ridgeline-whisky-tumblers",
    name: "Ridgeline Whisky Tumblers",
    tagline: "Set of 2, faceted base",
    description:
      "A faceted base catches low light the way a good dram deserves. Cut slightly heavier than our Harbor Rocks glass, for the collector who likes their whisky glass to feel like an object first.",
    price: 980,
    currency: "ZAR",
    images: [
      "/images/products/lowland-wine-glasses-1.svg",
      "/images/products/lowland-wine-glasses-2.svg",
    ],
    categorySlug: "glassware",
    material: "Lead-free crystal",
    setSize: "Set of 2",
    inStock: true,
    badges: ["New"],
    variants: [
      { id: "clear", label: "Clear", swatch: "#F7F5F0" },
      { id: "amber", label: "Amber Tint", swatch: "#B69A68" },
    ],
    rating: 4.8,
    reviewCount: 17,
  },
  {
    id: "prod-drift-table-runner",
    slug: "drift-linen-table-runner",
    name: "Drift Linen Table Runner",
    tagline: "14 x 108 in, stonewashed",
    description:
      "The same stonewashed linen as our napkins, cut long and generous to anchor a full table setting. Softens further with every wash.",
    price: 890,
    currency: "ZAR",
    images: [
      "/images/products/wilder-linen-napkins-1.svg",
      "/images/products/wilder-linen-napkins-2.svg",
    ],
    categorySlug: "tableware",
    material: "100% European linen",
    inStock: true,
    badges: ["New"],
    variants: [
      { id: "ivory", label: "Ivory", swatch: "#F7F5F0" },
      { id: "sage", label: "Sage", swatch: "#8A9683" },
      { id: "clay", label: "Clay", swatch: "#B08A6B" },
    ],
    rating: 4.7,
    reviewCount: 12,
  },
  {
    id: "prod-cove-bar-tools",
    slug: "cove-copper-bar-tools",
    name: "Cove Copper Bar Tools Set",
    tagline: "Bar spoon, strainer & muddler",
    description:
      "A hand-hammered copper bar spoon, Hawthorne strainer and muddler, hung together on a small oak stand that earns its place on the counter, not just the cabinet.",
    price: 1620,
    currency: "ZAR",
    images: [
      "/images/products/meridian-cocktail-shaker-1.svg",
      "/images/products/meridian-cocktail-shaker-2.svg",
    ],
    categorySlug: "barware",
    material: "Hammered copper, oak stand",
    setSize: "3-piece set",
    inStock: true,
    badges: ["New"],
    rating: 4.9,
    reviewCount: 8,
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(categorySlug: string) {
  return products.filter((product) => product.categorySlug === categorySlug);
}

export function getBestsellers() {
  return products.filter((product) => product.badges?.includes("Bestseller"));
}

export function getNewArrivals() {
  return products.filter((product) => product.badges?.includes("New"));
}
