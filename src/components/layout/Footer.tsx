import Link from "next/link";
import { Mail, MapPin } from "lucide-react";
import { InstagramIcon, FacebookIcon, TikTokIcon, PinterestIcon, WhatsAppIcon } from "@/components/icons/SocialIcons";
import { paymentIcons } from "@/components/icons/PaymentIcons";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";
import { CookieSettingsLink } from "./CookieSettingsLink";
import { helpLinks, aboutLinks, policyLinks, getSocialLinks, getContactInfo, type NavLink } from "./nav-data";
import { getCategories } from "@/data/categories";
import { getNewsletterContent } from "@/lib/admin/content-store";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { formatPrice } from "@/lib/utils";

const socialIconMap = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  TikTok: TikTokIcon,
  Pinterest: PinterestIcon,
} as const;

export function Footer() {
  const shopLinks: NavLink[] = getCategories().map((c) => ({ label: c.name, href: `/shop/${c.slug}` }));
  const socialLinks = getSocialLinks();
  const newsletter = getNewsletterContent();
  const contactInfo = getContactInfo();
  const settings = getStoreSettings();
  return (
    <footer className="mt-24 bg-charcoal text-warm-white print:hidden">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-[1.3fr_0.85fr_0.85fr_0.85fr_0.85fr_1.15fr]">
          <div className="sm:col-span-2 lg:col-span-1 lg:pr-6">
            <Logo inverse />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-warm-white/60">
              Made for moments worth raising a glass to. Premium glassware, barware and tableware
              for entertaining, gifting and everyday living.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 text-sm text-warm-white/75">
              <a
                href={`mailto:${contactInfo.email}`}
                className="link-underline focus-ring inline-flex w-fit items-center gap-2 hover:text-warm-white"
              >
                <Mail className="h-4 w-4 text-warm-white/50" />
                {contactInfo.email}
              </a>
              <a
                href={contactInfo.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="link-underline focus-ring inline-flex w-fit items-center gap-2 hover:text-warm-white"
              >
                <WhatsAppIcon className="h-4 w-4 text-warm-white/50" />
                Chat on WhatsApp
              </a>
              <span className="inline-flex w-fit items-center gap-2 text-warm-white/50">
                <MapPin className="h-4 w-4" />
                Delivering across South Africa
              </span>
            </div>

            <div className="mt-6 flex items-center gap-3">
              {socialLinks.map(({ label, href }) => {
                const Icon = socialIconMap[label as keyof typeof socialIconMap];
                return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-warm-white/20 text-warm-white/80 transition-colors hover:border-warm-white hover:text-warm-white"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn title="Support" links={helpLinks} />
          <FooterColumn title="About" links={aboutLinks} />
          <FooterColumn title="Policies" links={policyLinks} />

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-warm-white/50">
              {newsletter.heading}
            </h3>
            <p className="mt-4 text-sm text-warm-white/60">{newsletter.description}</p>
            <NewsletterForm className="mt-5" />
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-6 border-t border-warm-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-sm text-xs leading-relaxed text-warm-white/50">
            Free delivery on orders over {formatPrice(settings.freeDeliveryThreshold)}. Most orders ship
            within 2–4 business days, with complimentary gift wrapping available at checkout.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {paymentIcons.map(({ label, Icon }) => (
              <Icon key={label} className="h-6 w-10 text-warm-white/60" />
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-warm-white/10 pt-8 text-xs text-warm-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Clink &amp; Co by HEIMSIGHT. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/privacy" className="link-underline hover:text-warm-white/70">
              Privacy Policy
            </Link>
            <Link href="/terms" className="link-underline hover:text-warm-white/70">
              Terms of Service
            </Link>
            <Link href="/cookie-policy" className="link-underline hover:text-warm-white/70">
              Cookie Policy
            </Link>
            <CookieSettingsLink className="link-underline hover:text-warm-white/70" />
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-warm-white/50">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="link-underline text-sm text-warm-white/75 hover:text-warm-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
