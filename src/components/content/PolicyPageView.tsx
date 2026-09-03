import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import type { PolicyPageContent } from "@/types/content";

/** Shared layout for /privacy, /terms and /cookie-policy — all three read the same PolicyPageContent shape from the content store. */
export function PolicyPageView({ content }: { content: PolicyPageContent }) {
  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: content.title }]} className="mb-6" />

      <h1 className="font-display text-display-2xl text-charcoal">{content.title}</h1>
      <p className="mt-2 text-xs text-stone">
        Last updated{" "}
        {new Date(content.updatedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
      </p>
      <p className="mt-6 text-sm leading-relaxed text-stone">{content.intro}</p>

      <div className="mt-10 flex flex-col gap-8">
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
