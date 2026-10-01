import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import { getActiveProducts, getProductBySlug, getProducts } from "@/data/products";
import { getPairedProducts, getRelatedProducts } from "@/lib/catalogue";
import { getReviewsForProduct } from "@/lib/reviews-store";
import { getQAForProduct } from "@/lib/qa-store";
import { getUser } from "@/lib/supabase/dal";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { siteConfig } from "@/config/site";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";

export async function generateStaticParams() {
  return (await getProducts()).map((product) => ({ slug: product.slug }));
}

// Products are admin-editable via the in-memory store — a background
// revalidation within this hour picks up edits without a redeploy.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/products/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  const title = product.seoTitle || (product.discontinued ? `${product.name} (Discontinued)` : product.name);
  const description = product.seoDescription || product.shortDescription;
  const canonical = `/products/${product.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/products/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, activeProducts, user] = await Promise.all([
    getCategoryBySlug(product.categorySlug),
    getActiveProducts(),
    getUser(),
  ]);
  const relatedProducts = getRelatedProducts(product, activeProducts);
  const pairedProducts = getPairedProducts(product, activeProducts);
  const [{ reviews, pendingIds }, qaEntries] = await Promise.all([
    getReviewsForProduct({ id: product.id, slug: product.slug, name: product.name }, user?.id ?? null),
    getQAForProduct(product.id, product.slug),
  ]);
  const pendingReviewIds = [...pendingIds];

  const availability = product.discontinued
    ? "https://schema.org/Discontinued"
    : product.inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku,
    image: product.images,
    category: category?.name,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url: `${siteConfig.url}/products/${product.slug}`,
      priceCurrency: product.currency,
      price: product.price,
      availability,
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.rating !== undefined && product.reviewCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
    ...(reviews.length > 0
      ? {
          review: reviews.slice(0, 10).map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.customerName },
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
            reviewBody: review.review,
            ...(review.date ? { datePublished: review.date } : {}),
          })),
        }
      : {}),
  };

  const breadcrumbs = [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    ...(category ? [{ label: category.name, href: `/shop/${category.slug}` }] : []),
    { label: product.name },
  ];

  return (
    <>
      <JsonLd data={[jsonLd, breadcrumbJsonLd(breadcrumbs)]} />
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        pairedProducts={pairedProducts}
        reviews={reviews}
        pendingReviewIds={pendingReviewIds}
        qaEntries={qaEntries}
        breadcrumbs={breadcrumbs}
      />
    </>
  );
}
