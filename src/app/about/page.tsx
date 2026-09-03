import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { buttonVariants } from "@/components/ui/Button";
import { getAboutPageContent } from "@/lib/admin/content-store";
import { cn } from "@/lib/utils";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Our Story",
  description: "The story behind Clink & Co by HEIMSIGHT — considered glassware, barware and tableware for the table.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  const content = getAboutPageContent();

  return (
    <>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
        <JsonLd data={breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "About" }])} />
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About" }]} className="mb-6" />

        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">{content.heroEyebrow}</p>
        <h1 className="font-display mt-3 max-w-2xl text-display-2xl text-charcoal">{content.heroTitle}</h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-stone">{content.heroDescription}</p>

        <div className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-3xl">
          <Image
            src={content.heroImage}
            alt={content.heroImageAlt}
            fill
            sizes="(min-width: 1024px) 960px, 100vw"
            className="object-cover"
            priority
          />
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-2">
          {content.sections.map((section) => (
            <div key={section.heading}>
              <h2 className="font-display text-display-sm text-charcoal">{section.heading}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone">{section.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-4 rounded-3xl border border-sand bg-porcelain px-6 py-14 text-center">
          <h2 className="font-display text-display-lg text-charcoal">See it for yourself</h2>
          <p className="max-w-md text-sm leading-relaxed text-stone">
            Explore the full collection — glassware, barware and tableware designed to be used, not just admired.
          </p>
          <Link href="/shop" className={cn(buttonVariants({ size: "lg" }), "mt-2")}>
            Shop the Collection
          </Link>
        </div>
      </div>

      <NewsletterSection />
    </>
  );
}
