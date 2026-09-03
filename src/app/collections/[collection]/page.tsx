import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCuratedCollections, getCollectionBySlug } from "@/data/collections";
import { getProductsByCollection } from "@/data/products";
import { ShopExperience } from "@/components/catalogue/ShopExperience";
import { ShopSkeleton } from "@/components/catalogue/ShopSkeleton";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";

export async function generateStaticParams() {
  return (await getCuratedCollections()).map((collection) => ({ collection: collection.id }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/collections/[collection]">): Promise<Metadata> {
  const { collection: slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) return {};
  const canonical = `/collections/${collection.id}`;
  return {
    title: collection.name,
    description: collection.description,
    alternates: { canonical },
    openGraph: {
      title: collection.name,
      description: collection.description,
      url: canonical,
    },
    twitter: {
      card: "summary_large_image",
      title: collection.name,
      description: collection.description,
    },
  };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[collection]">) {
  const { collection: slug } = await params;
  const collection = await getCollectionBySlug(slug);
  if (!collection) notFound();

  const scopedProducts = getProductsByCollection(collection.id);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Collections", href: "/collections" },
    { label: collection.name },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Suspense fallback={<ShopSkeleton />}>
        <ShopExperience
          products={scopedProducts}
          title={collection.name}
          description={collection.description}
          breadcrumbs={breadcrumbs}
          lockedCollection={collection.id}
        />
      </Suspense>
    </>
  );
}
