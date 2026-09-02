"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Heart, Menu, Search as SearchIcon, ShoppingBag, User } from "lucide-react";
import { Logo } from "./Logo";
import { MegaMenu, type MegaMenuKey } from "./MegaMenu";
import { MobileDrawer } from "./MobileDrawer";
import { primaryNav } from "./nav-data";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { SearchModal } from "@/components/search/SearchModal";
import { useCartCount, useCartStore } from "@/store/cart-store";
import { useWishlistCount } from "@/store/wishlist-store";
import { useUIStore } from "@/store/ui-store";
import { useAuthUser } from "@/lib/hooks/use-auth-user";
import { cn } from "@/lib/utils";

const MENU_CLOSE_DELAY = 150;

export function Header() {
  const pathname = usePathname();
  const transparent = useUIStore((state) => state.overHero);

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [activeMenu, setActiveMenu] = React.useState<MegaMenuKey | null>(null);
  const [menuAutoFocus, setMenuAutoFocus] = React.useState(false);
  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRefs = React.useRef<Partial<Record<MegaMenuKey, HTMLAnchorElement | null>>>({});

  const cartCount = useCartCount();
  const wishlistCount = useWishlistCount();
  const openCart = useCartStore((state) => state.open);
  const { user } = useAuthUser();

  const cancelClose = React.useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = React.useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setActiveMenu(null), MENU_CLOSE_DELAY);
  }, [cancelClose]);

  const openMenu = React.useCallback(
    (key: MegaMenuKey, viaKeyboard = false) => {
      cancelClose();
      setActiveMenu(key);
      setMenuAutoFocus(viaKeyboard);
    },
    [cancelClose],
  );

  const closeMenuAndRefocus = React.useCallback(() => {
    setActiveMenu((current) => {
      if (current) triggerRefs.current[current]?.focus();
      return null;
    });
  }, []);

  // Reset transient UI (mega menu, mobile drawer) when the route changes.
  // Adjusted during render (not an effect) per React's "resetting state
  // when a prop changes" pattern — avoids an extra commit-then-reset pass.
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setActiveMenu(null);
    setMobileOpen(false);
  }

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveMenu(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  const iconButtonClass = (extra?: string) =>
    cn(
      "focus-ring relative flex h-10 w-10 items-center justify-center rounded-full transition-colors",
      transparent ? "text-warm-white hover:bg-warm-white/15" : "text-charcoal hover:bg-sand",
      extra,
    );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5 print:hidden">
        <div className="relative mx-auto max-w-7xl">
          <div
            className={cn(
              "flex items-center justify-between rounded-full border px-4 py-2.5 backdrop-blur-md transition-colors duration-300 sm:px-6",
              transparent
                ? "border-warm-white/25 bg-warm-white/10"
                : "border-sand/70 bg-warm-white/90 shadow-card",
            )}
          >
            <Logo inverse={transparent} />

            <nav className="hidden items-center gap-1 xl:flex" aria-label="Primary">
              {primaryNav.map((link) => {
                const menuKey: MegaMenuKey | null =
                  link.label === "Shop" ? "shop" : link.label === "Collections" ? "collections" : null;
                const active = isActive(link.href);
                const linkClass = cn(
                  "link-underline focus-ring flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium transition-colors",
                  transparent
                    ? active
                      ? "text-warm-white"
                      : "text-warm-white/80 hover:text-warm-white"
                    : active
                      ? "text-charcoal"
                      : "text-charcoal/75 hover:text-charcoal",
                );

                if (!menuKey) {
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={active ? "page" : undefined}
                      data-active={active}
                      className={linkClass}
                    >
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <div
                    key={link.href}
                    className="relative"
                    onMouseEnter={() => openMenu(menuKey)}
                    onMouseLeave={scheduleClose}
                  >
                    <Link
                      href={link.href}
                      ref={(el) => {
                        triggerRefs.current[menuKey] = el;
                      }}
                      aria-haspopup="true"
                      aria-expanded={activeMenu === menuKey}
                      aria-current={active ? "page" : undefined}
                      data-active={active}
                      className={linkClass}
                      onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                          e.preventDefault();
                          openMenu(menuKey, true);
                        }
                      }}
                    >
                      {link.label}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 transition-transform duration-300",
                          activeMenu === menuKey && "rotate-180",
                        )}
                      />
                    </Link>
                  </div>
                );
              })}
            </nav>

            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                className={iconButtonClass()}
              >
                <SearchIcon className="h-[18px] w-[18px]" />
              </button>
              <Link
                href={user ? "/account" : "/login"}
                aria-label={user ? "Account" : "Log in"}
                className={iconButtonClass("hidden xl:flex")}
              >
                <User className="h-[18px] w-[18px]" />
              </Link>
              <Link
                href="/wishlist"
                aria-label={`Wishlist, ${wishlistCount} ${wishlistCount === 1 ? "item" : "items"}`}
                className={iconButtonClass("hidden xl:flex")}
              >
                <Heart className="h-[18px] w-[18px]" />
                {wishlistCount > 0 && <CountBadge count={wishlistCount} transparent={transparent} />}
              </Link>
              <button
                type="button"
                aria-label={`Shopping bag, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                onClick={openCart}
                className={iconButtonClass()}
              >
                <ShoppingBag className="h-[18px] w-[18px]" />
                {cartCount > 0 && <CountBadge count={cartCount} transparent={transparent} />}
              </button>
              <button
                type="button"
                aria-label="Open menu"
                onClick={() => setMobileOpen(true)}
                className={iconButtonClass("xl:hidden")}
              >
                <Menu className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>

          <MegaMenu
            active={activeMenu}
            autoFocus={menuAutoFocus}
            onNavigate={() => setActiveMenu(null)}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            onEscape={closeMenuAndRefocus}
          />
        </div>
      </header>

      <MobileDrawer open={mobileOpen} onClose={() => setMobileOpen(false)} />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
    </>
  );
}

function CountBadge({ count, transparent }: { count: number; transparent: boolean }) {
  return (
    <span
      className={cn(
        "absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-semibold",
        transparent ? "bg-warm-white text-charcoal" : "bg-charcoal text-warm-white",
      )}
    >
      {count}
    </span>
  );
}
