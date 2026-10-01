import { siteConfig } from "@/config/site";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/** BreadcrumbList JSON-LD for a page's breadcrumb trail — the last item (no `href`) is the current page. */
export function breadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: `${siteConfig.url}${item.href}` } : {}),
    })),
  };
}

/**
 * `JSON.stringify` alone doesn't escape `</script>` — a value containing
 * that literal substring (e.g. a product review's text) would close the
 * script tag early and let anything after it run as markup/script in the
 * page. Escaping `<` to its Unicode escape keeps the JSON semantically
 * identical (JSON parsers treat `<` the same as `<`) while making the
 * serialized output impossible to break out of.
 */
export function safeJsonLdStringify(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Renders one or more JSON-LD objects as `<script type="application/ld+json">` tags. */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data];
  return (
    <>
      {items.map((item, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(item) }} />
      ))}
    </>
  );
}
