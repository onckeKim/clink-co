import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug } from "@/data/categories";
import { getPairedProducts, getProductBySlug, getRelatedProducts, products } from "@/data/products";
import { getReviewsForProduct } from "@/data/reviews";
import { getQAForProduct } from "@/data/qa";
import { ProductDetailView } from "@/components/product/ProductDetailView";
import { siteConfig } from "@/config/site";

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
    title: product.discontinued ? `${product.name} (Discontinued)` : product.name,
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
  const pairedProducts = getPairedProducts(product);
  const seedReviews = getReviewsForProduct(product.slug);
  const qaEntries = getQAForProduct(product.slug);

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
    ...(seedReviews.length > 0
      ? {
          review: seedReviews.slice(0, 10).map((review) => ({
            "@type": "Review",
            author: { "@type": "Person", name: review.customerName },
            reviewRating: { "@type": "Rating", ratingValue: review.rating, bestRating: 5, worstRating: 1 },
            reviewBody: review.review,
            ...(review.date ? { datePublished: review.date } : {}),
          })),
        }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetailView
        product={product}
        relatedProducts={relatedProducts}
        pairedProducts={pairedProducts}
        seedReviews={seedReviews}
        qaEntries={qaEntries}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(category ? [{ label: category.name, href: `/shop/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />
    </>
  );
}
