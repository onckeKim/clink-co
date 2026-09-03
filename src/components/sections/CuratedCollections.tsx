import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { getCuratedCollections } from "@/data/collections";

export function CuratedCollections() {
  const curatedCollections = getCuratedCollections();
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
      <Reveal>
        <SectionHeading
          eyebrow="Curated for you"
          title="Collections Worth Exploring"
          description="Three ways into the range, grouped by how you actually shop."
        />
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        {curatedCollections.slice(0, 3).map((collection, i) => (
          <Reveal key={collection.id} delay={i * 0.08}>
            <Link
              href={collection.href}
              className="focus-ring group relative block aspect-[4/5] overflow-hidden rounded-3xl"
            >
              <Image
                src={collection.image}
                alt={collection.name}
                fill
                sizes="(min-width: 640px) 32vw, 90vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-charcoal/0" />
              <div className="absolute inset-x-0 bottom-0 p-6">
                <p className="font-display text-2xl text-warm-white">{collection.name}</p>
                <p className="mt-2 max-w-xs text-sm text-warm-white/75">{collection.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-warm-white">
                  Shop the edit
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
