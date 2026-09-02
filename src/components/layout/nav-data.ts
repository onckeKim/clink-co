export interface NavLink {
  label: string;
  href: string;
}

/** Primary desktop + mobile navigation. "Shop" and "Collections" also open a mega menu. */
export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/new-arrivals" },
  { label: "Gifts", href: "/gifts" },
  { label: "About", href: "/about" },
  { label: "Journal", href: "/journal" },
];

export interface Collection {
  label: string;
  href: string;
  description: string;
}

/** Curated editorial collections shown in the "Collections" mega menu. */
export const collections: Collection[] = [
  {
    label: "The Autumn Edit",
    href: "/collections/autumn-edit",
    description: "Seasonal glassware and warm-toned tableware for the months ahead.",
  },
  {
    label: "Wedding Registry",
    href: "/collections/wedding-registry",
    description: "Build a registry made of pieces guests actually reach for.",
  },
  {
    label: "Housewarming",
    href: "/collections/housewarming",
    description: "Considered first pieces for a table just getting started.",
  },
  {
    label: "Corporate Gifting",
    href: "/collections/corporate-gifting",
    description: "Branded, boxed and shipped at scale — talk to our trade team.",
  },
  {
    label: "Best Sellers",
    href: "/shop?filter=bestseller",
    description: "The pieces our community reaches for again and again.",
  },
];

export const accountLinks: NavLink[] = [
  { label: "My Account", href: "/account" },
  { label: "Order History", href: "/account/orders" },
  { label: "Wishlist", href: "/wishlist" },
];

export const helpLinks: NavLink[] = [
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "Care Guide", href: "/care-guide" },
  { label: "FAQ", href: "/faq" },
];

export const aboutLinks: NavLink[] = [
  { label: "Our Story", href: "/about" },
  { label: "Journal", href: "/journal" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Trade & Wholesale", href: "/trade" },
];

export const policyLinks: NavLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Accessibility", href: "/accessibility" },
];

import { siteConfig } from "@/config/site";

export interface SocialLink {
  label: string;
  href: string;
}

/** Derived from siteConfig so there's one place to update social handles. */
export const socialLinks: SocialLink[] = [
  { label: "Instagram", href: siteConfig.social.instagram },
  { label: "Facebook", href: siteConfig.social.facebook },
  { label: "TikTok", href: siteConfig.social.tiktok },
  { label: "Pinterest", href: siteConfig.social.pinterest },
];

export const contactInfo = {
  email: siteConfig.contactEmail,
  whatsappHref: siteConfig.social.whatsapp,
};
