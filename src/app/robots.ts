import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

/**
 * Disallows crawling of session/account-specific and non-content surfaces.
 * `/cart`, `/checkout`, `/account` and `/admin` are the pages explicitly
 * called out for no-index treatment; `/api`, `/auth` and `/dev` are added
 * as routine hygiene — none of them are indexable content either.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/cart", "/checkout", "/account", "/admin", "/api", "/auth", "/dev"],
    },
    sitemap: [
      `${siteConfig.url}/sitemap.xml`,
      `${siteConfig.url}/products/sitemap.xml`,
      `${siteConfig.url}/journal/sitemap.xml`,
    ],
    host: siteConfig.url,
  };
}
