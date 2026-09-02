"use client";

import { useEffect, useRef } from "react";
import { useUIStore } from "@/store/ui-store";

/**
 * Mount this at the bottom edge of a page's dark hero section. It tells the
 * floating Header (via useUIStore) whether it's still visually overlapping
 * the hero, so the header can render transparent/tinted over the hero and
 * switch to a solid surface once it scrolls clear. Pages that never mount
 * this keep the header's safe default: solid.
 */
export function HeroWaypoint() {
  const ref = useRef<HTMLDivElement>(null);
  const setOverHero = useUIStore((state) => state.setOverHero);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setOverHero(entry.isIntersecting),
      // Shrinks the effective viewport by the header's approximate height,
      // so "overHero" flips to false right as the header would start
      // sitting over non-hero content instead of the hero image.
      { rootMargin: "-96px 0px 0px 0px", threshold: 0 },
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      setOverHero(false);
    };
  }, [setOverHero]);

  return <div ref={ref} aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px" />;
}
