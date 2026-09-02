import Link from "next/link";
import { InstagramIcon, FacebookIcon, YoutubeIcon } from "@/components/icons/SocialIcons";
import { Logo } from "./Logo";
import { NewsletterForm } from "./NewsletterForm";

const shopLinks = [
  { label: "Glassware", href: "/shop/glassware" },
  { label: "Barware", href: "/shop/barware" },
  { label: "Tableware", href: "/shop/tableware" },
  { label: "Gift Sets", href: "/shop/gift-sets" },
];

const companyLinks = [
  { label: "Our Story", href: "/our-story" },
  { label: "Journal", href: "/journal" },
  { label: "Sustainability", href: "/sustainability" },
  { label: "Trade & Wholesale", href: "/trade" },
];

const helpLinks = [
  { label: "Contact Us", href: "/contact" },
  { label: "Shipping & Returns", href: "/shipping-returns" },
  { label: "Care Guide", href: "/care-guide" },
  { label: "FAQ", href: "/faq" },
];

export function Footer() {
  return (
    <footer className="mt-24 bg-ink text-ivory">
      <div className="mx-auto max-w-7xl px-6 py-16 sm:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1.2fr]">
          <div className="lg:pr-8">
            <Logo inverse />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/60">
              Made for moments worth raising a glass to. Premium glassware, barware and tableware
              for entertaining, gifting and everyday living.
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { Icon: InstagramIcon, label: "Instagram" },
                { Icon: FacebookIcon, label: "Facebook" },
                { Icon: YoutubeIcon, label: "YouTube" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-ivory/20 text-ivory/80 transition-colors hover:border-ivory hover:text-ivory"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn title="Company" links={companyLinks} />
          <FooterColumn title="Help" links={helpLinks} />

          <div>
            <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-ivory/50">
              Join the list
            </h3>
            <p className="mt-4 text-sm text-ivory/60">
              New arrivals, restocks and the occasional invitation — no more than twice a month.
            </p>
            <NewsletterForm className="mt-5" />
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ivory/10 pt-8 text-xs text-ivory/40 sm:flex-row sm:items-center sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Clink &amp; Co by Heimsight. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="link-underline hover:text-ivory/70">
              Privacy Policy
            </Link>
            <Link href="/terms" className="link-underline hover:text-ivory/70">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-[0.2em] text-ivory/50">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="link-underline text-sm text-ivory/75 hover:text-ivory"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
