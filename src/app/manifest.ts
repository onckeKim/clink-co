import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.fullName,
    short_name: siteConfig.name,
    description: siteConfig.tagline,
    start_url: "/",
    display: "standalone",
    background_color: "#f7f5f0",
    theme_color: "#1c1c1a",
    icons: [
      { src: "/icons/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
