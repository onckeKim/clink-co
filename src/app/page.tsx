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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.fullName,
  alternateName: siteConfig.name,
  url: siteConfig.url,
  sameAs: [
    siteConfig.social.instagram,
    siteConfig.social.facebook,
    siteConfig.social.tiktok,
    siteConfig.social.pinterest,
  ],
  slogan: siteConfig.tagline,
};

export default function Home() {
  return (
    <>
      {/* Structured data for SEO — helps search engines surface the brand + social profiles. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero />

      <div className="mt-3 sm:mt-5">
        <FeatureStrip />
      </div>

      <CategoryShowcase />

      <LifestyleSplit
        eyebrow="Editorial"
        title="The Art of Hosting Well"
        description="Hosting well isn't about grand gestures — it's the right glass in hand, a table that feels considered without feeling fussy, and pieces sturdy enough to survive the actual evening. We design for that: the quiet, repeatable moments of entertaining, not just the highlight reel."
        cta={{ label: "Shop Entertaining", href: "/shop" }}
        image="/images/editorial-hosting.svg"
        imageAlt="A table set for entertaining with Clink & Co glassware and tableware"
      />

      <Bestsellers />

      <NewArrivals />

      <CuratedCollections />

      <BrandStory />

      <ReviewsCarousel />

      <SocialGallery />

      <NewsletterSection />

      <RecentlyViewed />
    </>
  );
}
