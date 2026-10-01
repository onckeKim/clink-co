import * as React from "react";

/**
 * Drives any horizontally-scrolling, scroll-snap track: exposes the ref to
 * attach, prev/next scroll actions, and live "can scroll" booleans so arrow
 * buttons can disable themselves at the ends. Used by the generic Carousel
 * and by the simpler multi-item-per-view product rows (Bestsellers, New
 * Arrivals) alike.
 */
export function useHorizontalScroll<T extends HTMLElement>() {
  const trackRef = React.useRef<T>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateBounds = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setCanScrollPrev(el.scrollLeft > 8);
    setCanScrollNext(el.scrollLeft < max - 8);
  }, []);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    updateBounds();

    el.addEventListener("scroll", updateBounds, { passive: true });
    const resizeObserver = new ResizeObserver(updateBounds);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", updateBounds);
      resizeObserver.disconnect();
    };
  }, [updateBounds]);

  const scrollByAmount = React.useCallback((amount: number) => {
    trackRef.current?.scrollBy({ left: amount, behavior: "smooth" });
  }, []);

  const scrollPrev = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    scrollByAmount(-el.clientWidth * 0.9);
  }, [scrollByAmount]);

  const scrollNext = React.useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    scrollByAmount(el.clientWidth * 0.9);
  }, [scrollByAmount]);

  const scrollToIndex = React.useCallback((index: number) => {
    const el = trackRef.current;
    if (!el) return;
    const child = el.children[index] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft, behavior: "smooth" });
    }
  }, []);

  return { trackRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext, scrollToIndex };
}
