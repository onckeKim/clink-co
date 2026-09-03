import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCuratedCollections, getCollectionBySlug } from "@/data/collections";
import { getProductsByCollection } from "@/data/products";
import { ShopExperience } from "@/components/catalogue/ShopExperience";
import { ShopSkeleton } from "@/components/catalogue/ShopSkeleton";

export function generateStaticParams() {
  return getCuratedCollections().map((collection) => ({ collection: collection.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[collection]">): Promise<Metadata> {
  const { collection: slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description,
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[collection]">) {
  const { collection: slug } = await params;
  const collection = getCollectionBySlug(slug);
  if (!collection) notFound();

  const scopedProducts = getProductsByCollection(collection.id);

  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopExperience
        products={scopedProducts}
        title={collection.name}
        description={collection.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Collections", href: "/collections" },
          { label: collection.name },
        ]}
        lockedCollection={collection.id}
      />
    </Suspense>
  );
}
