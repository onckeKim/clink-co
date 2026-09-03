import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import { ShopExperience } from "@/components/catalogue/ShopExperience";
import { ShopSkeleton } from "@/components/catalogue/ShopSkeleton";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";

export async function generateStaticParams() {
  return (await getCategories()).map((category) => ({ category: category.slug }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};
  const title = category.seoTitle || category.name;
  const description = category.seoDescription || category.description;
  const canonical = `/shop/${category.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: [{ url: category.image }] },
    twitter: { card: "summary_large_image", title, description, images: [category.image] },
  };
}

export default async function ShopCategoryPage({ params }: PageProps<"/shop/[category]">) {
  const { category: slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const scopedProducts = getProductsByCategory(category.slug);
  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: category.name },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Suspense fallback={<ShopSkeleton />}>
        <ShopExperience
          products={scopedProducts}
          title={category.name}
          description={category.description}
          breadcrumbs={breadcrumbs}
          lockedCategory={category.slug}
        />
      </Suspense>
    </>
  );
}
