import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Share2, Send, MessageCircle, Mail } from "lucide-react";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { getArticleBySlug, getPublishedArticles } from "@/lib/admin/content-store";
import { siteConfig } from "@/config/site";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";

export function generateStaticParams() {
  return getPublishedArticles().map((article) => ({ slug: article.slug }));
}

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt;
  const canonical = `/journal/${article.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      publishedTime: article.publishedAt,
      authors: [article.author],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export default async function JournalArticlePage({ params }: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const articleUrl = `${siteConfig.url}/journal/${article.slug}`;
  const published = getPublishedArticles();
  const relatedByCategory = published.filter((a) => a.id !== article.id && a.category === article.category);
  const relatedByTag = published.filter(
    (a) => a.id !== article.id && !relatedByCategory.includes(a) && a.tags.some((t) => article.tags.includes(t)),
  );
  const relatedArticles = [...relatedByCategory, ...relatedByTag].slice(0, 3);

  const shareLinks = [
    { label: "Share on Facebook", icon: Share2, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}` },
    {
      label: "Share on X",
      icon: Send,
      href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(article.title)}`,
    },
    {
      label: "Share on WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${encodeURIComponent(`${article.title} — ${articleUrl}`)}`,
    },
    { label: "Share via email", icon: Mail, href: `mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(articleUrl)}` },
  ];

  const breadcrumbs = [{ label: "Home", href: "/" }, { label: "Journal", href: "/journal" }, { label: article.title }];

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: [`${siteConfig.url}${article.coverImage}`],
    datePublished: article.publishedAt,
    author: { "@type": "Organization", name: article.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: `${siteConfig.url}/icon` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <JsonLd data={[articleJsonLd, breadcrumbJsonLd(breadcrumbs)]} />
      <Breadcrumbs items={breadcrumbs} className="mb-6" />

      {article.publishStatus === "draft" && (
        <div className="mb-6 rounded-xl border border-champagne bg-champagne/20 px-4 py-3 text-sm text-charcoal">
          This article is a draft and isn&apos;t listed on the Journal yet — only visible via direct link.
        </div>
      )}

      <Link
        href={`/journal?category=${encodeURIComponent(article.category)}`}
        className="link-underline text-xs font-semibold uppercase tracking-[0.2em] text-stone"
      >
        {article.category}
      </Link>
      <p className="mt-2 text-xs text-stone">
        {formatDate(article.publishedAt)}
        {" · "}
        {article.author}
      </p>
      <h1 className="font-display mt-2 text-display-2xl text-charcoal">{article.title}</h1>

      <div className="relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-3xl">
        <Image
          src={article.coverImage}
          alt={article.coverImageAlt}
          fill
          sizes="(min-width: 1024px) 768px, 100vw"
          className="object-cover"
          priority
        />
      </div>

      <div className="mt-8 flex flex-col gap-5">
        {article.body.map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed text-stone">
            {paragraph}
          </p>
        ))}
      </div>

      {article.tags.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-porcelain px-3 py-1 text-xs text-stone">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-8 flex items-center gap-3 border-y border-sand py-4">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Share</span>
        {shareLinks.map(({ label, icon: Icon, href }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            className="focus-ring flex h-9 w-9 items-center justify-center rounded-full border border-sand text-charcoal hover:border-charcoal/40"
          >
            <Icon className="h-4 w-4" />
          </a>
        ))}
      </div>

      {relatedArticles.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-display-sm text-charcoal">Related reading</h2>
          <div className="mt-5 grid gap-8 sm:grid-cols-3">
            {relatedArticles.map((related) => (
              <Link key={related.id} href={`/journal/${related.slug}`} className="focus-ring group block">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                  <Image
                    src={related.coverImage}
                    alt={related.coverImageAlt}
                    fill
                    sizes="(min-width: 640px) 30vw, 90vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                </div>
                <h3 className="font-display mt-3 text-base text-charcoal group-hover:underline">{related.title}</h3>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
