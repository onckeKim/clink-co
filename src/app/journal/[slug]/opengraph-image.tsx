import { ImageResponse } from "next/og";
import { SocialCard } from "@/lib/og/social-card";
import { getArticleBySlug } from "@/lib/admin/content-store";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  return new ImageResponse(
    <SocialCard
      eyebrow={article ? `Journal · ${article.category}` : "Journal"}
      title={article?.title ?? "Clink & Co by HEIMSIGHT"}
      footer={article ? `By ${article.author}` : undefined}
    />,
    size,
  );
}
