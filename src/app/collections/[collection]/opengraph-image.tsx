import { ImageResponse } from "next/og";
import { SocialCard } from "@/lib/og/social-card";
import { getCollectionBySlug } from "@/data/collections";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ collection: string }> }) {
  const { collection: slug } = await params;
  const collection = getCollectionBySlug(slug);

  return new ImageResponse(
    <SocialCard
      eyebrow="Curated Collection"
      title={collection?.name ?? "Clink & Co by HEIMSIGHT"}
      footer={collection?.description}
    />,
    size,
  );
}
