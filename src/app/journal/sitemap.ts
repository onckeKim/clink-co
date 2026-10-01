import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getPublishedArticles } from "@/lib/admin/content-store";

export default function sitemap(): MetadataRoute.Sitemap {
  return getPublishedArticles().map((article) => ({
    url: `${siteConfig.url}/journal/${article.slug}`,
    lastModified: new Date(article.publishedAt),
    changeFrequency: "monthly",
    priority: 0.5,
    images: [`${siteConfig.url}${article.coverImage}`],
  }));
}
