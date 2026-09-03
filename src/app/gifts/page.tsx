import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { ProductCard } from "@/components/product/ProductCard";
import { buttonVariants } from "@/components/ui/Button";
import { getActiveProducts } from "@/data/products";
import type { Product } from "@/types/product";
import { cn, formatPrice } from "@/lib/utils";
import { breadcrumbJsonLd, JsonLd } from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  title: "Gift Guide",
  description: "Find the right Clink & Co by HEIMSIGHT gift by occasion, budget or recipient — from wedding gifts to corporate gifting.",
  alternates: { canonical: "/gifts" },
};

function hasAnyTag(product: Product, tags: string[]): boolean {
  return product.tags.some((t) => tags.includes(t));
}

const WEDDING_TAGS = ["wedding gift", "wedding registry"];
const HOUSEWARMING_TAGS = ["housewarming gift"];
const HOST_TAGS = ["housewarming gift", "entertaining", "dinner party", "table setting"];

const BUDGET_TIERS = [
  { label: "Under R750", priceMax: 750, query: "0-750" },
  { label: "R750 – R1,500", priceMax: 1500, priceMin: 750, query: "750-1500" },
  { label: "Over R1,500", priceMin: 1500, query: "1500-99999" },
];

function GiftSection({
  id,
  title,
  description,
  products,
  shopHref,
}: {
  id?: string;
  title: string;
  description: string;
  products: Product[];
  shopHref: string;
}) {
  if (products.length === 0) return null;
  return (
    <section id={id} className="mt-16 scroll-mt-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-display-lg text-charcoal">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone">{description}</p>
        </div>
        <Link href={shopHref} className="link-underline shrink-0 text-sm font-medium text-charcoal">
          Shop all →
        </Link>
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

export default function GiftsPage() {
  const products = getActiveProducts();

  const weddingGifts = products.filter((p) => hasAnyTag(p, WEDDING_TAGS));
  const housewarmingGifts = products.filter((p) => hasAnyTag(p, HOUSEWARMING_TAGS));
  const hostGifts = products.filter((p) => hasAnyTag(p, HOST_TAGS) || p.categorySlug === "gift-sets");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10 sm:px-8">
      <JsonLd data={breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Gift Guide" }])} />
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Gift Guide" }]} className="mb-6" />

      <div className="max-w-2xl">
        <h1 className="font-display text-display-2xl text-charcoal">Gift Guide</h1>
        <p className="mt-4 text-sm leading-relaxed text-stone">
          A gift that says more than the card does. Whatever the occasion, here&apos;s our edit of pieces people
          actually use — boxed, ribboned and ready to give.
        </p>
      </div>

      <section className="mt-10">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Shop by occasion</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Wedding Gifts", href: "#wedding" },
            { label: "Housewarming Gifts", href: "#housewarming" },
            { label: "Gifts for Hosts", href: "#hosts" },
            { label: "Corporate Gifting", href: "#corporate" },
          ].map((occasion) => (
            <a
              key={occasion.label}
              href={occasion.href}
              className="focus-ring rounded-2xl border border-sand px-5 py-4 text-center text-sm font-medium text-charcoal transition-colors hover:border-charcoal/40"
            >
              {occasion.label}
            </a>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-display-lg text-charcoal">Shop by budget</h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone">
          Every price point deserves a gift that feels considered — here&apos;s where to start.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {BUDGET_TIERS.map((tier) => (
            <Link
              key={tier.label}
              href={`/shop?price=${tier.query}`}
              className="focus-ring group flex flex-col justify-between rounded-2xl border border-sand bg-porcelain p-6"
            >
              <p className="font-display text-xl text-charcoal">{tier.label}</p>
              <span className="mt-4 text-sm font-medium text-charcoal underline-offset-4 group-hover:underline">
                Shop this range →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <GiftSection
        id="hosts"
        title="Gifts for Hosts"
        description="For the person who's always setting the table for someone else — pieces that make hosting feel a little less like work."
        products={hostGifts}
        shopHref="/shop/gift-sets"
      />

      <GiftSection
        id="wedding"
        title="Wedding Gifts"
        description="Considered pieces for the newlyweds — the kind that get used long after the toast."
        products={weddingGifts}
        shopHref="/shop?category=glassware"
      />

      <GiftSection
        id="housewarming"
        title="Housewarming Gifts"
        description="For the new-home friend — something that makes the space feel like theirs from the first dinner."
        products={housewarmingGifts}
        shopHref="/shop"
      />

      <section id="corporate" className="mt-16 scroll-mt-24 rounded-3xl border border-sand bg-porcelain px-6 py-14 text-center sm:px-12">
        <Building2 className="mx-auto h-7 w-7 text-stone" />
        <h2 className="font-display mt-4 text-display-lg text-charcoal">Corporate Gifting</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone">
          Client gifts, team milestones, event favours — we can put together bespoke sets at volume, with branding
          and delivery handled for you. Get in touch and our team will help you plan it.
        </p>
        <Link href="/contact?category=Corporate%20Gifting" className={cn(buttonVariants({ size: "lg" }), "mt-6")}>
          Enquire about Corporate Gifting
        </Link>
      </section>

      <p className="mt-16 text-xs leading-relaxed text-stone">
        All gifts ship with complimentary gift wrapping and a handwritten note available at checkout. Prices shown
        from {formatPrice(products.reduce((min, p) => Math.min(min, p.price), Infinity))}.
      </p>
    </div>
  );
}
