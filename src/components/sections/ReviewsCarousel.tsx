import Link from "next/link";
import { BadgeCheck, Quote } from "lucide-react";
import { Carousel } from "@/components/ui/Carousel";
import { Rating } from "@/components/ui/Rating";
import { SectionHeading } from "@/components/sections/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { reviews } from "@/data/reviews";

export function ReviewsCarousel() {
  const slides = reviews.map((review) => (
    <div key={review.id} className="flex justify-center px-6 py-2 sm:px-8">
      <div className="w-full max-w-2xl rounded-3xl border border-sand/70 bg-warm-white p-8 text-center sm:p-12">
        <Quote className="mx-auto h-8 w-8 text-champagne" strokeWidth={1.5} />
        <Rating value={review.rating} size="md" className="mt-4 justify-center" />
        <p className="font-display mt-5 text-xl leading-snug text-charcoal sm:text-2xl">
          &ldquo;{review.review}&rdquo;
        </p>
        <div className="mt-6 flex flex-col items-center gap-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-charcoal">
            {review.customerName}
            {review.verified && (
              <span className="inline-flex items-center gap-1 text-xs font-normal text-success">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified buyer
              </span>
            )}
          </div>
          <p className="text-xs text-stone">{review.location}</p>
          <Link
            href={`/product/${review.productSlug}`}
            className="link-underline mt-1 text-xs font-medium text-stone hover:text-charcoal"
          >
            Purchased: {review.productPurchased}
          </Link>
        </div>
      </div>
    </div>
  ));

  return (
    <section className="bg-sand/40 py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="From our customers"
            title="Loved at every table"
            description="A few words from the people who've made these pieces part of their routine."
          />
        </Reveal>
      </div>

      <div className="mt-10">
        <Carousel slides={slides} autoplayInterval={6000} ariaLabel="Customer reviews" />
      </div>
    </section>
  );
}
