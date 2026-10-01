import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { getActiveProducts } from "@/data/products";

interface GlassType {
  type: string;
  image: string;
  count: number;
}

function groupByGlassType(products: Awaited<ReturnType<typeof getActiveProducts>>): GlassType[] {
  const byType = new Map<string, GlassType>();
  for (const product of products) {
    const existing = byType.get(product.productType);
    if (existing) {
      existing.count += 1;
    } else {
      byType.set(product.productType, {
        type: product.productType,
        image: product.images[0] ?? "",
        count: 1,
      });
    }
  }
  return Array.from(byType.values()).sort((a, b) => b.count - a.count);
}

/**
 * The storefront is a single-category (Glassware) boutique now — a grid of
 * category cards would just show one tile, so this groups the live catalogue
 * by productType ("Champagne Glasses", "Tumblers", ...) instead, giving
 * shoppers a "shop by glass" entry point that still scales as the range grows.
 */
export async function CategoryShowcase() {
  const products = await getActiveProducts();
  const glassTypes = groupByGlassType(products);

  if (!glassTypes.length) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8" aria-labelledby="shop-by-glass">
      <Reveal>
        <SectionHeading
          eyebrow="Shop by glass"
          title="Find your perfect pour"
          description="A focused edit of glassware, each piece hand-finished for the way you actually drink — from the first pour to the last toast."
          cta={{ label: "View all glassware", href: "/shop" }}
        />
      </Reveal>

      <div
        className="mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-visible sm:pb-0 sm:[scrollbar-width:auto] lg:grid-cols-4 [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {glassTypes.map((glassType, i) => (
          <Reveal key={glassType.type} delay={i * 0.06} className="w-[68vw] shrink-0 snap-start sm:w-auto">
            <div role="listitem">
              <Link
                href={`/shop?type=${encodeURIComponent(glassType.type)}`}
                className="focus-ring group relative block aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <Image
                  src={glassType.image}
                  alt={glassType.type}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/0 to-charcoal/0" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="font-display text-lg text-warm-white">{glassType.type}</p>
                  <p className="text-xs uppercase tracking-wide text-warm-white/70">
                    {glassType.count} {glassType.count === 1 ? "style" : "styles"}
                  </p>
                </div>
              </Link>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
