import { ImageResponse } from "next/og";
import { SocialCard } from "@/lib/og/social-card";
import { siteConfig } from "@/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <SocialCard eyebrow="Premium Glassware, Barware & Tableware" title={siteConfig.tagline} footer={siteConfig.url.replace(/^https?:\/\//, "")} />,
    size,
  );
}
