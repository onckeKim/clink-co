"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Heart, Mail, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { primaryNav, accountLinks, helpLinks, getSocialLinks } from "./nav-data";
import { getCategories } from "@/data/categories";
import { getCuratedCollections } from "@/data/collections";
import { InstagramIcon, FacebookIcon, TikTokIcon, PinterestIcon } from "@/components/icons/SocialIcons";
import { useWishlistCount } from "@/store/wishlist-store";
import { cn } from "@/lib/utils";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";

const socialIconMap = {
  Instagram: InstagramIcon,
  Facebook: FacebookIcon,
  TikTok: TikTokIcon,
  Pinterest: PinterestIcon,
} as const;

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [expanded, setExpanded] = React.useState<string | null>(null);
  const wishlistCount = useWishlistCount();
  const socialLinks = getSocialLinks();
  const panelRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap(open, onClose, panelRef);

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-50 flex justify-end xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Site menu"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          <motion.div
            ref={panelRef}
            tabIndex={-1}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="focus-ring relative flex h-full w-full max-w-sm flex-col bg-porcelain shadow-lifted"
          >
            <div className="flex items-center justify-between border-b border-sand px-5 py-4">
              <Logo compact />
              <button
                type="button"
                aria-label="Close menu"
                onClick={onClose}
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              <nav aria-label="Primary">
                <ul className="flex flex-col">
                  {primaryNav.map((link) => {
                    const hasChildren = link.label === "Shop" || link.label === "Collections";
                    const isExpanded = expanded === link.label;
                    return (
                      <li key={link.href} className="border-b border-sand/70">
                        {hasChildren ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setExpanded(isExpanded ? null : link.label)}
                              aria-expanded={isExpanded}
                              className="focus-ring flex w-full items-center justify-between py-4 text-left"
                            >
                              <span className="font-display text-2xl text-charcoal">
                                {link.label}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 text-stone transition-transform duration-300",
                                  isExpanded && "rotate-180",
                                )}
                              />
                            </button>
                            <AnimatePresence initial={false}>
                              {isExpanded && (
                                <motion.ul
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                  className="overflow-hidden"
                                >
                                  {(link.label === "Shop"
                                    ? getCategories().map((c) => ({ label: c.name, href: `/shop/${c.slug}` }))
                                    : getCuratedCollections().map((c) => ({ label: c.name, href: c.href }))
                                  ).map((item) => (
                                    <li key={item.href}>
                                      <Link
                                        href={item.href}
                                        className="focus-ring block py-2.5 pl-1 text-sm text-stone hover:text-charcoal"
                                      >
                                        {item.label}
                                      </Link>
                                    </li>
                                  ))}
                                </motion.ul>
                              )}
                            </AnimatePresence>
                          </>
                        ) : (
                          <Link
                            href={link.href}
                            className="focus-ring font-display block py-4 text-2xl text-charcoal"
                          >
                            {link.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </nav>

              <div className="mt-6 flex flex-col gap-1">
                {accountLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="focus-ring flex items-center gap-3 rounded-lg px-1 py-2.5 text-sm font-medium text-charcoal"
                  >
                    {link.label === "Wishlist" ? (
                      <Heart className="h-4 w-4 text-stone" />
                    ) : (
                      <User className="h-4 w-4 text-stone" />
                    )}
                    {link.label}
                    {link.label === "Wishlist" && wishlistCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-charcoal px-1 text-[10px] font-semibold text-warm-white">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                ))}
                {helpLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="focus-ring flex items-center gap-3 rounded-lg px-1 py-2.5 text-sm font-medium text-charcoal"
                  >
                    <Mail className="h-4 w-4 text-stone" />
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="border-t border-sand px-5 py-5">
              <div className="flex items-center gap-3">
                {socialLinks.map(({ label, href }) => {
                  const Icon = socialIconMap[label as keyof typeof socialIconMap];
                  return (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-sand text-charcoal transition-colors hover:border-charcoal"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
