import { ImageResponse } from "next/og";
import { BrandMark } from "@/lib/og/brand-mark";

export const contentType = "image/png";

/** Fixed-path 192×192 icon for the web manifest — `icon.tsx`'s file-convention output carries a build hash in its URL, unusable for a manifest's static `icons[].src`. */
export function GET() {
  return new ImageResponse(<BrandMark size={192} radius={40} />, { width: 192, height: 192 });
}
