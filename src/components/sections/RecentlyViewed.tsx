"use client";

import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { useRecentlyViewedStore } from "@/store/recently-viewed-store";
import { useMounted } from "@/lib/hooks/use-mounted";
import { formatPrice } from "@/lib/utils";

/** Only renders once the visitor has actually viewed a product this session. */
export function RecentlyViewed({ excludeProductId }: { excludeProductId?: string } = {}) {
  const mounted = useMounted();
  const allItems = useRecentlyViewedStore((state) => state.items);
  const items = excludeProductId ? allItems.filter((item) => item.productId !== excludeProductId) : allItems;

  if (!mounted || items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
      <Reveal>
        <SectionHeading eyebrow="Pick up where you left off" title="Recently Viewed" />
      </Reveal>

      <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => (
          <Reveal key={item.productId} delay={i * 0.05}>
            <Link href={`/products/${item.slug}`} className="focus-ring group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sand/40">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="(min-width: 1024px) 24vw, (min-width: 640px) 30vw, 45vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
              <div className="mt-4 flex flex-col gap-1">
                <h3 className="text-sm font-medium text-charcoal">{item.name}</h3>
                <p className="text-xs text-stone">{item.shortDescription}</p>
                <div className="flex items-baseline gap-1.5">
                  {item.compareAtPrice && (
                    <span className="text-xs text-stone line-through">
                      {formatPrice(item.compareAtPrice)}
                    </span>
                  )}
                  <span className="text-sm font-medium text-charcoal">{formatPrice(item.price)}</span>
                </div>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
