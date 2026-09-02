"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { categories } from "@/data/categories";
import { collections } from "./nav-data";

export type MegaMenuKey = "shop" | "collections";

export function MegaMenu({
  active,
  autoFocus = false,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
  onEscape,
}: {
  active: MegaMenuKey | null;
  /** Focus the panel's first link on open — set when opened via ArrowDown, not hover. */
  autoFocus?: boolean;
  onNavigate: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  /** Close the menu and return focus to its trigger. */
  onEscape: () => void;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (active && autoFocus) {
      panelRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    }
  }, [active, autoFocus]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              onEscape();
            }
          }}
          className="absolute inset-x-0 top-full z-30 hidden justify-center px-3 xl:flex"
        >
          <div
            ref={panelRef}
            role="region"
            aria-label={active === "shop" ? "Shop menu" : "Collections menu"}
            className="mt-3 w-full max-w-4xl overflow-hidden rounded-3xl border border-sand/70 bg-warm-white shadow-lifted"
          >
            {active === "shop" ? (
              <ShopMenu onNavigate={onNavigate} />
            ) : (
              <CollectionsMenu onNavigate={onNavigate} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ShopMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr] gap-8 p-8">
      <div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
          Shop by category
        </p>
        <ul className="grid grid-cols-2 gap-x-8 gap-y-1">
          {categories.map((category) => (
            <li key={category.id}>
              <Link
                href={`/shop/${category.slug}`}
                onClick={onNavigate}
                className="focus-ring group flex items-center justify-between rounded-lg px-2 py-2.5 text-sm text-charcoal transition-colors hover:bg-porcelain"
              >
                {category.name}
                <span className="text-xs text-stone">{category.itemCount}</span>
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href="/shop"
          onClick={onNavigate}
          className="focus-ring mt-4 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-sm font-medium text-charcoal hover:underline"
        >
          Shop everything
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <Link
        href="/shop/gift-sets"
        onClick={onNavigate}
        className="focus-ring group relative block overflow-hidden rounded-2xl"
      >
        <div className="relative aspect-[4/3]">
          <Image
            src="/images/categories/gift-sets.svg"
            alt="Clink & Co gift sets"
            fill
            sizes="320px"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/0" />
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-champagne">
            Gift Edit
          </p>
          <p className="font-display text-lg text-warm-white">Boxed & ready to give</p>
        </div>
      </Link>
    </div>
  );
}

function CollectionsMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="p-8">
      <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
        Curated collections
      </p>
      <ul className="grid grid-cols-2 gap-x-10 gap-y-5">
        {collections.map((collection) => (
          <li key={collection.href}>
            <Link
              href={collection.href}
              onClick={onNavigate}
              className="focus-ring group block rounded-lg px-2 py-1"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
                {collection.label}
                <ArrowUpRight className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-xs leading-relaxed text-stone">
                {collection.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
