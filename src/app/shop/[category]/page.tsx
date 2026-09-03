import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getCategoryBySlug } from "@/data/categories";
import { getProductsByCategory } from "@/data/products";
import { ShopExperience } from "@/components/catalogue/ShopExperience";
import { ShopSkeleton } from "@/components/catalogue/ShopSkeleton";

export function generateStaticParams() {
  return getCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[category]">): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};
  return {
    title: category.name,
    description: category.description,
  };
}

export default async function ShopCategoryPage({ params }: PageProps<"/shop/[category]">) {
  const { category: slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  const scopedProducts = getProductsByCategory(category.slug);

  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopExperience
        products={scopedProducts}
        title={category.name}
        description={category.description}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: category.name },
        ]}
        lockedCategory={category.slug}
      />
    </Suspense>
  );
}
