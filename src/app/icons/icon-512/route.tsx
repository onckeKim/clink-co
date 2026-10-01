import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/og/brand-mark";

export const contentType = "image/png";

/** Fixed-path 512×512 icon for the web manifest — see icon-192/route.tsx. */
export function GET() {
  return new ImageResponse(<BrandMark size={512} radius={108} />, { width: 512, height: 512 });
}
