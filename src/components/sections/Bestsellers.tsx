"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { useHorizontalScroll } from "@/lib/hooks/use-horizontal-scroll";
import { useCatalog } from "@/components/providers/CatalogProvider";
import { cn } from "@/lib/utils";

export function Bestsellers() {
  const { products } = useCatalog();
  const bestsellers = products.filter((p) => p.badges?.includes("Bestseller"));
  const { trackRef, canScrollPrev, canScrollNext, scrollPrev, scrollNext } =
    useHorizontalScroll<HTMLDivElement>();

  if (bestsellers.length === 0) return null;

  return (
    <section className="bg-charcoal py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Customer favourites"
            title="The Bestsellers"
            description="Experience the pieces our community reaches for again and again."
            cta={{ label: "View All", href: "/shop?sort=best-selling" }}
            inverse
          />
        </Reveal>

        <div className="relative mt-10">
          <div
            ref={trackRef}
            role="list"
            aria-label="Bestselling products"
            className="flex snap-x snap-mandatory gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {bestsellers.map((product, i) => (
              <Reveal
                key={product.id}
                delay={i * 0.05}
                className="w-[72vw] shrink-0 snap-start sm:w-[45vw] lg:w-[31%] xl:w-[23%]"
              >
                <div role="listitem">
                  <ProductCard product={product} inverse detailed />
                </div>
              </Reveal>
            ))}
          </div>

          <button
            type="button"
            onClick={scrollPrev}
            disabled={!canScrollPrev}
            aria-label="Previous products"
            className={cn(
              "focus-ring absolute -left-4 top-[35%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-warm-white text-charcoal shadow-card transition-opacity lg:flex",
              !canScrollPrev && "pointer-events-none opacity-0",
            )}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={scrollNext}
            disabled={!canScrollNext}
            aria-label="Next products"
            className={cn(
              "focus-ring absolute -right-4 top-[35%] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-warm-white text-charcoal shadow-card transition-opacity lg:flex",
              !canScrollNext && "pointer-events-none opacity-0",
            )}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
