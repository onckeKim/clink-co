import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { getArticleBySlug, getPublishedArticles } from "@/lib/admin/content-store";

export function generateStaticParams() {
  return getPublishedArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/journal/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    openGraph: { images: [{ url: article.coverImage }] },
  };
}

export default async function JournalArticlePage({ params }: PageProps<"/journal/[slug]">) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <Breadcrumbs
        items={[{ label: "Home", href: "/" }, { label: "Journal", href: "/journal" }, { label: article.title }]}
        className="mb-6"
      />

      {article.publishStatus === "draft" && (
        <div className="mb-6 rounded-xl border border-champagne bg-champagne/20 px-4 py-3 text-sm text-charcoal">
          This article is a draft and isn&apos;t listed on the Journal yet — only visible via direct link.
        </div>
      )}

      <p className="text-xs text-stone">
        {new Date(article.publishedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
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
    </div>
  );
}
