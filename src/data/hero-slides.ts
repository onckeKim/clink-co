export interface HeroSlide {
  id: string;
  eyebrow: string;
  heading: string;
  copy: string;
  image: string;
  imageAlt: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
}

/**
 * Hero carousel content. Shaped the way an admin dashboard would eventually
 * edit it — one row per slide, in display order — so swapping this for a
 * `hero_slides` Supabase table later is a matter of fetching instead of
 * importing. A single slide still renders fine with the carousel controls
 * hidden (see Hero.tsx), so this list can safely shrink to one entry.
 */
export const heroSlides: HeroSlide[] = [
  {
    id: "autumn-edit",
    eyebrow: "The Autumn Edit",
    heading: "Made for moments worth raising a glass to.",
    copy: "Considered glassware, barware and tableware from Clink & Co by HEIMSIGHT — designed for the dinners that run late and the Tuesdays that deserve a little ceremony too.",
    image: "/images/hero-table.svg",
    imageAlt: "A table set with Clink & Co glassware, catching warm evening light",
    primaryCta: { label: "Shop the Collection", href: "/shop" },
    secondaryCta: { label: "Explore New Arrivals", href: "/#new-arrivals" },
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
  },
];
