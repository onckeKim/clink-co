"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { Logo } from "./Logo";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useCartCount, useCartStore } from "@/store/cart-store";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Shop", href: "/shop" },
  { label: "Collections", href: "/collections" },
  { label: "Gifting", href: "/gifting" },
  { label: "Our Story", href: "/our-story" },
  { label: "Journal", href: "/journal" },
];

export function Header() {
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const cartCount = useCartCount();
  const openCart = useCartStore((state) => state.open);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5">
        <div
          className={cn(
            "mx-auto flex max-w-7xl items-center justify-between rounded-full border border-sand/70 bg-ivory/90 px-4 py-2.5 backdrop-blur-md transition-shadow duration-300 sm:px-6",
            scrolled && "shadow-card",
          )}
        >
          <Logo />

          <nav className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="link-underline focus-ring text-sm font-medium text-ink/80 transition-colors hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              aria-label="Search"
              className="focus-ring hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand sm:flex"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>
            <Link
              href="/account"
              aria-label="Account"
              className="focus-ring hidden h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand sm:flex"
            >
              <User className="h-[18px] w-[18px]" />
            </Link>
            <button
              type="button"
              aria-label={`Shopping bag, ${cartCount} items`}
              onClick={openCart}
              className="focus-ring relative flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand"
            >
              <ShoppingBag className="h-[18px] w-[18px]" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-ink px-1 text-[10px] font-semibold text-ivory">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="focus-ring flex h-10 w-10 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand lg:hidden"
            >
              <Menu className="h-[18px] w-[18px]" />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-ivory lg:hidden"
          >
            <div className="flex items-center justify-between px-5 pt-5">
              <Logo />
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <motion.nav
              initial="closed"
              animate="open"
              variants={{
                open: { transition: { staggerChildren: 0.05, delayChildren: 0.1 } },
              }}
              className="mt-16 flex flex-col gap-2 px-8"
            >
              {navLinks.map((link) => (
                <motion.div
                  key={link.href}
                  variants={{
                    closed: { opacity: 0, y: 12 },
                    open: { opacity: 1, y: 0 },
                  }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="font-display block border-b border-sand py-4 text-3xl text-ink"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>

      <CartDrawer />
    </>
  );
}
