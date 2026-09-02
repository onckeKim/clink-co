export interface NavLink {
  label: string;
  href: string;
}

/** Primary desktop + mobile navigation. "Shop" and "Collections" also open a mega menu. */
export const primaryNav: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "New Arrivals", href: "/shop?new=1" },
  { label: "Gifts", href: "/gifts" },
  { label: "About", href: "/about" },
  { label: "Journal", href: "/journal" },
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
