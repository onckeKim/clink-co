import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import { getProductBySlug, getRelatedProducts, products } from "@/data/products";
import { ProductDetailView } from "@/components/product/ProductDetailView";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.shortDescription,
    openGraph: {
      title: product.name,
      description: product.shortDescription,
      images: product.images[0] ? [{ url: product.images[0] }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const category = getCategoryBySlug(product.categorySlug);
  const relatedProducts = getRelatedProducts(product);

  return (
    <ProductDetailView
      product={product}
      relatedProducts={relatedProducts}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Shop", href: "/shop" },
        ...(category ? [{ label: category.name, href: `/shop/${category.slug}` }] : []),
        { label: product.name },
      ]}
    />
  );
}
