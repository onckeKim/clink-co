import Link from "next/link";
import { Hero } from "@/components/sections/Hero";
import { FeatureStrip } from "@/components/sections/FeatureStrip";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { LifestyleSplit } from "@/components/sections/LifestyleSplit";
import { Reveal } from "@/components/motion/Reveal";
import { CategoryCard } from "@/components/product/CategoryCard";
import { ProductCard } from "@/components/product/ProductCard";
import { buttonVariants } from "@/components/ui/Button";
import { categories } from "@/data/categories";
import { products, getBestsellers } from "@/data/products";
import { cn } from "@/lib/utils";

export default function Home() {
  const bestsellers = getBestsellers().length ? getBestsellers() : products.slice(0, 4);

  return (
    <>
      <Hero />

      <div className="mt-3 sm:mt-5">
        <FeatureStrip />
      </div>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Shop by category"
            title="Everything for the table"
            description="From the first pour to the last toast — glassware, barware and tableware built to be used, not just admired."
            cta={{ label: "View all categories", href: "/shop" }}
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
          {categories.slice(0, 4).map((category, i) => (
            <Reveal key={category.id} delay={i * 0.06}>
              <CategoryCard category={category} priority={i === 0} />
            </Reveal>
          ))}
        </div>
      </section>

      <LifestyleSplit
        eyebrow="Entertaining, well"
        title="Glassware that elevates the everyday pour"
        description="Our glassware is mouth-blown in small batches, then hand-finished so every piece carries a faint, honest variation. Weighted for the hand, shaped for the drink, and built to be part of the ritual for years — not just the occasion."
        cta={{ label: "Shop Glassware", href: "/shop/glassware" }}
        image="/images/lifestyle-glass.svg"
        imageAlt="Clink & Co glassware arranged on a linen-covered table"
      />

      <section className="bg-ink py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Customer favorites"
              title="The Bestsellers"
              description="Experience the pieces our community reaches for again and again."
              cta={{ label: "Shop all bestsellers", href: "/shop?filter=bestseller" }}
              inverse
            />
          </Reveal>

          <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {bestsellers.map((product, i) => (
              <Reveal key={product.id} delay={i * 0.06}>
                <ProductCard product={product} inverse />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <LifestyleSplit
        eyebrow="Gifting"
        title="A gift that says more than the card does"
        description="Boxed, ribboned and ready to give — our gift sets pair the pieces people actually use. Add a handwritten note at checkout and we'll take care of the rest."
        cta={{ label: "Shop Gift Sets", href: "/shop/gift-sets" }}
        image="/images/lifestyle-gift.svg"
        imageAlt="A Clink & Co gift set boxed and ribboned"
        reverse
      />

      <section className="mx-auto max-w-7xl px-6 pb-24 sm:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-sand px-8 py-16 text-center sm:py-20">
            <p className="mx-auto max-w-xl text-xs font-semibold uppercase tracking-[0.2em] text-clay">
              Heimsight House Promise
            </p>
            <h2 className="font-display mx-auto mt-4 max-w-2xl text-3xl leading-tight text-ink sm:text-4xl">
              Made for moments worth raising a glass to.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm text-clay">
              Every Clink & Co piece ships with our lifetime breakage guarantee — because the
              things you gather around should last as long as the memories.
            </p>
            <Link href="/shop" className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
              Start Shopping
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
