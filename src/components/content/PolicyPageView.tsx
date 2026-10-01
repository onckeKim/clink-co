import { AlertTriangle } from "lucide-react";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";
import type { PolicyPageContent } from "@/types/content";

/** Shared layout for every policy page (/privacy, /terms, /cookie-policy, /delivery-policy, /returns-policy, /payment-policy, /disclaimer) — all read the same PolicyPageContent shape from the content store. */
export function PolicyPageView({ content }: { content: PolicyPageContent }) {
  const breadcrumbs = [{ label: "Home", href: "/" }, { label: content.title }];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <Breadcrumbs items={breadcrumbs} className="mb-6" />

      <div className="mb-8 flex items-start gap-3 rounded-2xl border border-champagne bg-champagne/20 px-4 py-3 text-sm text-charcoal">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          This page contains placeholder legal copy for development purposes only. It must be reviewed and approved
          by a qualified South African legal professional before this site goes live.
        </p>
      </div>

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
