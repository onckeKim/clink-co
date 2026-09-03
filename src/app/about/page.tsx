import type { Metadata } from "next";
import Image from "next/image";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { getAboutPageContent } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Our Story",
  description: "The story behind Clink & Co by HEIMSIGHT — considered glassware, barware and tableware for the table.",
};

export default function AboutPage() {
  const content = getAboutPageContent();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
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
    </div>
  );
}
