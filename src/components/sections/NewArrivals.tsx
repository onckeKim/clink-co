import { SectionHeading } from "@/components/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ProductCard } from "@/components/product/ProductCard";
import { getNewArrivals } from "@/data/products";

export async function NewArrivals() {
  const newArrivals = await getNewArrivals();

  if (newArrivals.length === 0) return null;

  return (
    <section id="new-arrivals" className="scroll-mt-28 bg-porcelain py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Just landed"
            title="New Arrivals"
            description="Fresh off the workbench — the newest additions to the Clink & Co edit."
            cta={{ label: "Shop New Arrivals", href: "/shop?new=1" }}
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
          {newArrivals.map((product, i) => (
            <Reveal key={product.id} delay={i * 0.06}>
              <ProductCard product={product} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
