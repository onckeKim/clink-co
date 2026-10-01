"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useHorizontalScroll } from "@/lib/hooks/use-horizontal-scroll";
import { cn } from "@/lib/utils";

export interface CarouselProps {
  slides: React.ReactNode[];
  className?: string;
  /** Autoplay interval in ms; omit or 0 to disable autoplay. */
  autoplayInterval?: number;
  /** Light-on-dark control styling, for carousels placed over imagery. */
  inverse?: boolean;
  ariaLabel: string;
  onSlideChange?: (index: number) => void;
}

/**
 * One-slide-per-view carousel with prev/next arrows, dot pagination,
 * optional autoplay (paused on hover/focus), and keyboard/swipe support via
 * native scroll-snap. Used by the Hero and the customer reviews section.
 */
export function Carousel({
  slides,
  className,
  autoplayInterval,
  inverse = false,
  ariaLabel,
  onSlideChange,
}: CarouselProps) {
  const { trackRef, scrollPrev, scrollNext, scrollToIndex } = useHorizontalScroll<HTMLDivElement>();
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => {
      const index = Math.round(el.scrollLeft / Math.max(el.clientWidth, 1));
      setActiveIndex((prev) => (prev === index ? prev : index));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [trackRef]);

  React.useEffect(() => {
    onSlideChange?.(activeIndex);
  }, [activeIndex, onSlideChange]);

  React.useEffect(() => {
    if (!autoplayInterval || paused || slides.length <= 1) return;
    const id = setInterval(() => {
      const next = activeIndex >= slides.length - 1 ? 0 : activeIndex + 1;
      scrollToIndex(next);
    }, autoplayInterval);
    return () => clearInterval(id);
  }, [autoplayInterval, paused, activeIndex, slides.length, scrollToIndex]);

  const controlClass = cn(
    "focus-ring flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-colors",
    inverse
      ? "bg-warm-white/15 text-warm-white hover:bg-warm-white/25"
      : "bg-warm-white text-charcoal shadow-card hover:bg-porcelain",
  );

  return (
    <div
      className={cn("group/carousel relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        ref={trackRef}
        role="region"
        aria-roledescription="carousel"
        aria-label={ariaLabel}
        tabIndex={0}
        className="focus-ring flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            scrollNext();
          }
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            scrollPrev();
          }
        }}
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${slides.length}`}
            aria-hidden={i !== activeIndex}
            className="w-full shrink-0 snap-start"
          >
            {slide}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button
            type="button"
            onClick={scrollPrev}
            aria-label="Previous slide"
            className={cn(controlClass, "absolute left-4 top-1/2 -translate-y-1/2")}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            aria-label="Next slide"
            className={cn(controlClass, "absolute right-4 top-1/2 -translate-y-1/2")}
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div
            role="tablist"
            aria-label="Slide navigation"
            className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-2"
          >
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === activeIndex}
                aria-label={`Go to slide ${i + 1}`}
                onClick={() => scrollToIndex(i)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  i === activeIndex ? "w-6" : "w-2 opacity-60 hover:opacity-100",
                  inverse ? "bg-warm-white" : "bg-charcoal",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
