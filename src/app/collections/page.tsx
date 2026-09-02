import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { curatedCollections, getCollectionProductCount } from "@/data/collections";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";

export const metadata: Metadata = {
  title: "Collections",
  description: "Curated edits of the Clink & Co range, grouped by how you actually shop.",
};

export default function CollectionsIndexPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Collections" }]} className="mb-6" />

      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-display-2xl text-charcoal">Collections</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Curated edits of the range, grouped by how you actually shop.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {curatedCollections.map((collection) => (
          <Link
            key={collection.id}
            href={collection.href}
            className="focus-ring group relative block aspect-[4/5] overflow-hidden rounded-3xl"
          >
            <Image
              src={collection.image}
              alt={collection.name}
              fill
              sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-charcoal/0" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="font-display text-2xl text-warm-white">{collection.name}</p>
              <p className="mt-2 max-w-xs text-sm text-warm-white/75">{collection.description}</p>
              <span className="mt-3 block text-xs uppercase tracking-wide text-warm-white/60">
                {getCollectionProductCount(collection.id)} items
              </span>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-warm-white">
                Shop the edit
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
