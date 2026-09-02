import type { Product } from "@/types/product";

/**
 * Temporary seed data used to build and preview the storefront UI.
 * Once Supabase is connected, products should be fetched from the
 * `products` table instead — see src/lib/supabase.
 */
export const products: Product[] = [
  {
    id: "prod-solstice-coupe",
    slug: "solstice-coupe-glasses",
    name: "Solstice Coupe Glasses",
    tagline: "Set of 4, hand-finished rims",
    description:
      "A wide, shallow bowl balanced on a slender stem — the Solstice Coupe brings a soft amber cast to sparkling wine and classic cocktails alike. Each glass is mouth-blown and hand-finished, so faint variations in the rim are a mark of the process, not a flaw.",
    price: 78,
    currency: "USD",
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
    price: 68,
    currency: "USD",
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
    price: 96,
    currency: "USD",
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
    price: 148,
    currency: "USD",
    images: [
      "/images/products/aldine-decanter-1.svg",
      "/images/products/aldine-decanter-2.svg",
    ],
    categorySlug: "serving",
    material: "Hand-blown glass",
    capacity: "1 L",
    inStock: true,
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
    price: 58,
    currency: "USD",
    images: [
      "/images/products/wilder-linen-napkins-1.svg",
      "/images/products/wilder-linen-napkins-2.svg",
    ],
    categorySlug: "tableware",
    material: "100% European linen",
    setSize: "Set of 6",
    inStock: true,
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
    price: 84,
    compareAtPrice: 104,
    currency: "USD",
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
    price: 138,
    currency: "USD",
    images: [
      "/images/products/the-nightcap-gift-set-1.svg",
      "/images/products/the-nightcap-gift-set-2.svg",
    ],
    categorySlug: "gift-sets",
    setSize: "3-piece set",
    inStock: true,
    badges: ["Gift Edit"],
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
    price: 34,
    currency: "USD",
    images: [
      "/images/products/ember-taper-candles-1.svg",
      "/images/products/ember-taper-candles-2.svg",
    ],
    categorySlug: "accents",
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
    price: 46,
    currency: "USD",
    images: [
      "/images/products/stonewell-marble-coasters-1.svg",
      "/images/products/stonewell-marble-coasters-2.svg",
    ],
    categorySlug: "accents",
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
    price: 112,
    currency: "USD",
    images: [
      "/images/products/tidewater-ice-bucket-1.svg",
      "/images/products/tidewater-ice-bucket-2.svg",
    ],
    categorySlug: "serving",
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
    price: 72,
    currency: "USD",
    images: [
      "/images/products/lowland-wine-glasses-1.svg",
      "/images/products/lowland-wine-glasses-2.svg",
    ],
    categorySlug: "glassware",
    material: "Lead-free crystal",
    setSize: "Set of 4",
    inStock: true,
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
    price: 32,
    currency: "USD",
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
    price: 92,
    currency: "USD",
    images: [
      "/images/products/gathering-serving-tray-1.svg",
      "/images/products/gathering-serving-tray-2.svg",
    ],
    categorySlug: "serving",
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
    price: 74,
    currency: "USD",
    images: [
      "/images/products/toast-champagne-flutes-1.svg",
      "/images/products/toast-champagne-flutes-2.svg",
    ],
    categorySlug: "glassware",
    material: "Hand-blown glass",
    setSize: "Set of 4",
    inStock: true,
    rating: 4.9,
    reviewCount: 174,
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
