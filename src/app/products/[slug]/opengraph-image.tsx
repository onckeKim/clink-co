import { ImageResponse } from "next/og";
import { SocialCard } from "@/lib/og/social-card";
import { getCategoryBySlug } from "@/data/categories";
import { getProductBySlug } from "@/data/products";
import { formatPrice } from "@/lib/utils";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  const category = product ? await getCategoryBySlug(product.categorySlug) : undefined;

  return new ImageResponse(
    <SocialCard
      eyebrow={category?.name ?? "Shop"}
      title={product?.name ?? "Clink & Co by HEIMSIGHT"}
      footer={product ? formatPrice(product.price) : undefined}
    />,
    size,
  );
}
