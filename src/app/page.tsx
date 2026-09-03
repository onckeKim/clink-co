import type { ReactNode } from "react";
import { Hero } from "@/components/sections/Hero";
import { FeatureStrip } from "@/components/sections/FeatureStrip";
import { CategoryShowcase } from "@/components/sections/CategoryShowcase";
import { LifestyleSplit } from "@/components/sections/LifestyleSplit";
import { Bestsellers } from "@/components/sections/Bestsellers";
import { NewArrivals } from "@/components/sections/NewArrivals";
import { CuratedCollections } from "@/components/sections/CuratedCollections";
import { BrandStory } from "@/components/sections/BrandStory";
import { ReviewsCarousel } from "@/components/sections/ReviewsCarousel";
import { SocialGallery } from "@/components/sections/SocialGallery";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { RecentlyViewed } from "@/components/sections/RecentlyViewed";
import { siteConfig } from "@/config/site";
import { getEditorialSection, getHomepageSectionsConfig } from "@/lib/admin/content-store";
import { getStoreSettings } from "@/lib/admin/settings-store";

export default function Home() {
  const editorial = getEditorialSection();
  const { order, hidden } = getHomepageSectionsConfig();
  const settings = getStoreSettings();

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: settings.businessName,
    alternateName: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/icon`,
    sameAs: [
      settings.social.instagram,
      settings.social.facebook,
      settings.social.tiktok,
      settings.social.pinterest,
    ],
    slogan: siteConfig.tagline,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: settings.contactEmail,
      telephone: settings.contactPhone || undefined,
      areaServed: "ZA",
    },
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.fullName,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const sections: Record<string, ReactNode> = {
    hero: <Hero key="hero" />,
    "feature-strip": (
      <div key="feature-strip" className="mt-3 sm:mt-5">
        <FeatureStrip />
      </div>
    ),
    "category-showcase": <CategoryShowcase key="category-showcase" />,
    editorial: (
      <LifestyleSplit
        key="editorial"
        eyebrow={editorial.eyebrow}
        title={editorial.title}
        description={editorial.description}
        cta={{ label: editorial.ctaLabel, href: editorial.ctaHref }}
        image={editorial.image}
        imageAlt={editorial.imageAlt}
      />
    ),
    bestsellers: <Bestsellers key="bestsellers" />,
    "new-arrivals": <NewArrivals key="new-arrivals" />,
    "curated-collections": <CuratedCollections key="curated-collections" />,
    "brand-story": <BrandStory key="brand-story" />,
    reviews: <ReviewsCarousel key="reviews" />,
    "social-gallery": <SocialGallery key="social-gallery" />,
    newsletter: <NewsletterSection key="newsletter" />,
    "recently-viewed": <RecentlyViewed key="recently-viewed" />,
  };

  return (
    <>
      {/* Structured data for SEO — helps search engines surface the brand, social profiles and sitelinks search box. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />

      {order.filter((key) => !hidden.includes(key) && sections[key]).map((key) => sections[key])}
    </>
  );
}
