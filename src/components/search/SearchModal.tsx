"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Search, TrendingUp, X } from "lucide-react";
import { getActiveProducts } from "@/data/products";
import { highlightMatch, searchProducts } from "@/lib/catalogue";
import { formatPrice, cn } from "@/lib/utils";
import { useMounted } from "@/lib/hooks/use-mounted";
import { track } from "@/lib/analytics/track";
import { useCatalog } from "@/components/providers/CatalogProvider";

/** Renders `text` with the portion matching `query` wrapped for emphasis. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const segments = highlightMatch(text, query);
  return (
    <>
      {segments.map((segment, i) =>
        segment.match ? (
          <mark key={i} className="rounded-sm bg-champagne/50 text-charcoal">
            {segment.text}
          </mark>
        ) : (
          <React.Fragment key={i}>{segment.text}</React.Fragment>
        ),
      )}
    </>
  );
}

const RECENT_KEY = "clink-co-recent-searches";
const MAX_RECENT = 5;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeRecent(searches: string[]) {
  try {
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(searches));
  } catch {
    // localStorage unavailable (private mode, quota) — recent searches simply won't persist.
  }
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const mounted = useMounted();
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [query, setQuery] = React.useState("");
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [recent, setRecent] = React.useState<string[]>([]);

  // Reset search state when the modal transitions to open. Adjusted during
  // render (not an effect) per React's "resetting state when a prop
  // changes" pattern.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setRecent(readRecent());
      setQuery("");
      setActiveIndex(-1);
    }
  }

  // Actual side effects (focus, scroll lock) stay in an effect.
  React.useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(id);
      document.body.style.overflow = "";
    };
  }, [open]);

  const { categories, collections } = useCatalog();
  const q = query.trim();
  const results = React.useMemo(() => {
    if (!q) return [];
    return searchProducts(getActiveProducts(), q, categories, collections).slice(0, 6);
  }, [q, categories, collections]);

  const commitSearch = React.useCallback(
    (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) return;
      const next = [trimmed, ...recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(
        0,
        MAX_RECENT,
      );
      setRecent(next);
      writeRecent(next);
      track({ name: "product_searched", searchTerm: trimmed, resultCount: results.length });
      router.push(`/shop?q=${encodeURIComponent(trimmed)}`);
      onClose();
    },
    [recent, router, onClose, results.length],
  );

  const goToProduct = React.useCallback(
    (slug: string, term: string) => {
      const trimmed = term.trim();
      if (trimmed) {
        const next = [trimmed, ...recent.filter((r) => r.toLowerCase() !== trimmed.toLowerCase())].slice(
          0,
          MAX_RECENT,
        );
        setRecent(next);
        writeRecent(next);
      }
      router.push(`/products/${slug}`);
      onClose();
    },
    [recent, router, onClose],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }
    if (!results.length) {
      if (e.key === "Enter") commitSearch(query);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && results[activeIndex]) {
        goToProduct(results[activeIndex].slug, query);
      } else {
        commitSearch(query);
      }
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex flex-col bg-porcelain"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
        >
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 pt-6 sm:pt-10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                Search
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close search"
                className="focus-ring flex h-10 w-10 items-center justify-center rounded-full hover:bg-sand"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex items-center gap-3 border-b-2 border-charcoal pb-4">
              <Search className="h-6 w-6 shrink-0 text-stone" />
              <input
                ref={inputRef}
                type="text"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-controls="search-results-listbox"
                aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
                autoComplete="off"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(-1);
                }}
                onKeyDown={onKeyDown}
                placeholder="Search glassware, barware, gift sets…"
                className="font-display w-full bg-transparent text-2xl text-charcoal placeholder:text-stone/60 focus:outline-none sm:text-3xl"
              />
            </div>

            <div className="flex-1 overflow-y-auto py-8">
              {q ? (
                results.length > 0 ? (
                  <ul id="search-results-listbox" role="listbox" aria-label="Search results">
                    {results.map((product, i) => (
                      <li
                        key={product.id}
                        id={`search-result-${i}`}
                        role="option"
                        aria-selected={i === activeIndex}
                      >
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIndex(i)}
                          onClick={() => goToProduct(product.slug, query)}
                          className={cn(
                            "focus-ring flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left transition-colors",
                            i === activeIndex ? "bg-sand/60" : "hover:bg-sand/40",
                          )}
                        >
                          <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-sand/50">
                            <Image
                              src={product.images[0]}
                              alt=""
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-charcoal">
                              <Highlighted text={product.name} query={query} />
                            </p>
                            <p className="truncate text-xs text-stone">
                              <Highlighted text={product.shortDescription} query={query} />
                            </p>
                            {product.sku.toLowerCase().includes(query.trim().toLowerCase()) && (
                              <p className="mt-0.5 truncate text-[11px] text-stone/70">
                                SKU: <Highlighted text={product.sku} query={query} />
                              </p>
                            )}
                          </div>
                          <span className="shrink-0 text-sm font-medium text-charcoal">
                            {formatPrice(product.price)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-16 text-center">
                    <p className="font-display text-xl text-charcoal">
                      No results for &ldquo;{query}&rdquo;
                    </p>
                    <p className="max-w-xs text-sm text-stone">
                      Try a product name, SKU, category or collection — or browse popular categories
                      below.
                    </p>
                    <PopularCategories onNavigate={onClose} />
                  </div>
                )
              ) : (
                <div className="flex flex-col gap-8">
                  {recent.length > 0 && (
                    <div>
                      <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                        <Clock className="h-3.5 w-3.5" /> Recent searches
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {recent.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => setQuery(term)}
                            className="focus-ring rounded-full border border-sand px-4 py-2 text-sm text-charcoal transition-colors hover:border-charcoal"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
                      <TrendingUp className="h-3.5 w-3.5" /> Popular categories
                    </p>
                    <PopularCategories onNavigate={onClose} />
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PopularCategories({ onNavigate }: { onNavigate: () => void }) {
  const { categories } = useCatalog();
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
      {categories.slice(0, 5).map((category) => (
        <Link
          key={category.id}
          href={`/shop/${category.slug}`}
          onClick={onNavigate}
          className="focus-ring rounded-full bg-sand/60 px-4 py-2 text-sm text-charcoal transition-colors hover:bg-sand"
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
