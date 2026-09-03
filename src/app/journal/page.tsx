import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { getPublishedArticles } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes on hosting, glassware care and gifting from the Clink & Co editorial team.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

export default async function JournalIndexPage({ searchParams }: PageProps<"/journal">) {
  const params = await searchParams;
  const categoryParam = typeof params.category === "string" ? params.category : undefined;

  const articles = getPublishedArticles();
  const categories = [...new Set(articles.map((a) => a.category))].sort();
  const activeCategory = categoryParam && categories.includes(categoryParam) ? categoryParam : undefined;

  const featured = !activeCategory ? articles.find((a) => a.featured) : undefined;
  const visible = articles.filter((a) => a.id !== featured?.id && (!activeCategory || a.category === activeCategory));

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Journal" }]} className="mb-6" />

      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-display-2xl text-charcoal">Journal</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Notes on hosting, glassware care and gifting from our editorial team.
        </p>
      </div>

      {categories.length > 1 && (
        <div className="mb-10 flex flex-wrap gap-2">
          <Link
            href="/journal"
            className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
              !activeCategory ? "border-charcoal bg-charcoal text-warm-white" : "border-sand text-stone hover:border-charcoal/40"
            }`}
          >
            All
          </Link>
          {categories.map((category) => (
            <Link
              key={category}
              href={`/journal?category=${encodeURIComponent(category)}`}
              className={`focus-ring rounded-full border px-4 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
                activeCategory === category ? "border-charcoal bg-charcoal text-warm-white" : "border-sand text-stone hover:border-charcoal/40"
              }`}
            >
              {category}
            </Link>
          ))}
        </div>
      )}

      {featured && (
        <Link href={`/journal/${featured.slug}`} className="focus-ring group mb-12 grid gap-6 overflow-hidden rounded-3xl border border-sand sm:grid-cols-2">
          <div className="relative aspect-[16/10] sm:aspect-auto">
            <Image
              src={featured.coverImage}
              alt={featured.coverImageAlt}
              fill
              sizes="(min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              priority
            />
          </div>
          <div className="flex flex-col justify-center p-6 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Featured · {featured.category}</p>
            <h2 className="font-display mt-2 text-display-lg text-charcoal group-hover:underline">{featured.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone">{featured.excerpt}</p>
            <p className="mt-4 text-xs text-stone">{formatDate(featured.publishedAt)}</p>
          </div>
        </Link>
      )}

      {visible.length === 0 ? (
        <p className="text-sm text-stone">No articles in this category yet.</p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((article) => (
            <Link key={article.id} href={`/journal/${article.slug}`} className="focus-ring group block">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
                <Image
                  src={article.coverImage}
                  alt={article.coverImageAlt}
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
              <p className="mt-4 text-xs text-stone">
                {article.category} · {formatDate(article.publishedAt)}
              </p>
              <h2 className="font-display mt-1.5 text-xl text-charcoal group-hover:underline">{article.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-stone">{article.excerpt}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
