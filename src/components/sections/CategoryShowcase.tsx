import { SectionHeading } from "@/components/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryCard } from "@/components/product/CategoryCard";
import { getCategories } from "@/data/categories";

/**
 * All 6 categories in one row on large screens (no scrolling needed); a
 * swipeable, snap-scrolling row on mobile where 6 cards can't fit; a 3-up
 * grid at the tablet breakpoint in between.
 */
export async function CategoryShowcase() {
  const categories = await getCategories();
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8" aria-labelledby="shop-by-category">
      <Reveal>
        <SectionHeading
          eyebrow="Shop by category"
          title="Everything for the table"
          description="From the first pour to the last toast — glassware, barware and tableware built to be used, not just admired."
          cta={{ label: "View all categories", href: "/shop" }}
        />
      </Reveal>

      <div
        className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:pb-0 sm:[scrollbar-width:auto] lg:grid-cols-6 [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {categories.map((category, i) => (
          <Reveal key={category.id} delay={i * 0.06} className="w-[68vw] shrink-0 snap-start sm:w-auto">
            <div role="listitem">
              <CategoryCard category={category} priority={i === 0} />
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
