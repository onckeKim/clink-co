/**
 * Site-wide configuration. Values here are the kind of thing an admin
 * dashboard would eventually expose as editable settings (free delivery
 * threshold, social links, currency) — centralising them now means wiring
 * up that dashboard later is a matter of reading/writing this shape from
 * Supabase instead of hunting through components.
 */
export const siteConfig = {
  name: "Clink & Co",
  fullName: "Clink & Co by HEIMSIGHT",
  tagline: "Made for moments worth raising a glass to.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://clinkandco.com",

  currency: "ZAR" as const,
  locale: "en-ZA",

  /** South African VAT rate, as a whole percent. All displayed prices are VAT-inclusive, per local retail convention. */
  taxRatePercent: 15,

  /** Free delivery threshold, in the site currency's minor-free units (Rand). */
  freeDeliveryThreshold: 950,

  /** Return window, in days — surfaced in the benefit strip and footer. */
  returnWindowDays: 30,

  social: {
    instagram: "https://instagram.com/clinkandco",
    facebook: "https://facebook.com/clinkandco",
    tiktok: "https://tiktok.com/@clinkandco",
    pinterest: "https://pinterest.com/clinkandco",
    whatsapp: "https://wa.me/15550102024",
  },

  contactEmail: "hello@clinkandco.com",
} as const;
