import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { getPublishedArticles } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Journal",
  description: "Notes on hosting, glassware care and gifting from the Clink & Co editorial team.",
};

export default function JournalIndexPage() {
  const articles = getPublishedArticles();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Journal" }]} className="mb-6" />

      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-display-2xl text-charcoal">Journal</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Notes on hosting, glassware care and gifting from our editorial team.
        </p>
      </div>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/journal/${article.slug}`}
            className="focus-ring group block"
          >
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
              {new Date(article.publishedAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h2 className="font-display mt-1.5 text-xl text-charcoal group-hover:underline">{article.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone">{article.excerpt}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
