import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getActiveProducts } from "@/data/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return (await getActiveProducts()).map((product) => ({
    url: `${siteConfig.url}/products/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
    images: product.images.length ? [`${siteConfig.url}${product.images[0]}`] : undefined,
  }));
}
