"use client";

import * as React from "react";
import { BadgeCheck, ThumbsUp } from "lucide-react";
import type { Product } from "@/types/product";
import type { Review } from "@/data/reviews";
import { Rating } from "@/components/ui/Rating";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { WriteReviewForm } from "@/components/product/WriteReviewForm";
import { useSubmittedReviewsStore } from "@/store/submitted-reviews-store";
import { cn } from "@/lib/utils";

type SortKey = "recent" | "highest" | "lowest" | "helpful";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Most recent",
  highest: "Highest rated",
  lowest: "Lowest rated",
  helpful: "Most helpful",
};

function sortReviews(list: Review[], sort: SortKey): Review[] {
  const sorted = [...list];
  switch (sort) {
    case "highest":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "lowest":
      return sorted.sort((a, b) => a.rating - b.rating);
    case "helpful":
      return sorted.sort((a, b) => (b.helpfulCount ?? 0) - (a.helpfulCount ?? 0));
    case "recent":
    default:
      return sorted.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  }
}

export function ReviewsSection({ product, seedReviews }: { product: Product; seedReviews: Review[] }) {
  // Select the raw, stable array from the store and filter it in a memo —
  // filtering inline in the selector would return a new array reference on
  // every read, which breaks useSyncExternalStore's snapshot caching and
  // causes an infinite render loop.
  const allSubmittedReviews = useSubmittedReviewsStore((state) => state.reviews);
  const addSubmittedReview = useSubmittedReviewsStore((state) => state.add);

  const submittedReviews = React.useMemo(
    () => allSubmittedReviews.filter((review) => review.productSlug === product.slug),
    [allSubmittedReviews, product.slug],
  );

  const allReviews = React.useMemo(
    () => [...submittedReviews, ...seedReviews],
    [submittedReviews, seedReviews],
  );

  const stats = React.useMemo(() => {
    const histogram: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const review of allReviews) {
      const bucket = Math.min(5, Math.max(1, Math.round(review.rating))) as 1 | 2 | 3 | 4 | 5;
      histogram[bucket] += 1;
    }
    const count = allReviews.length;
    const average = count ? allReviews.reduce((sum, review) => sum + review.rating, 0) / count : 0;
    return { average, count, histogram };
  }, [allReviews]);

  const [ratingFilter, setRatingFilter] = React.useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [sortKey, setSortKey] = React.useState<SortKey>("recent");
  const [writeOpen, setWriteOpen] = React.useState(false);
  const [votedIds, setVotedIds] = React.useState<Set<string>>(new Set());
  const [enlargedImage, setEnlargedImage] = React.useState<string | null>(null);

  const filtered = ratingFilter
    ? allReviews.filter((review) => Math.round(review.rating) === ratingFilter)
    : allReviews;
  const visibleReviews = sortReviews(filtered, sortKey);

  const markHelpful = (id: string) => {
    setVotedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  return (
    <div id="reviews">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Customer reviews</p>
          <div className="mt-3 flex items-center gap-3">
            <span className="font-display text-4xl text-charcoal">{stats.average.toFixed(1)}</span>
            <div>
              <Rating value={stats.average} size="md" />
              <p className="mt-1 text-xs text-stone">
                Based on {stats.count} {stats.count === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>
        </div>

        <Button type="button" variant="secondary" onClick={() => setWriteOpen((open) => !open)}>
          {writeOpen ? "Close form" : "Write a review"}
        </Button>
      </div>

      {stats.count > 0 && (
        <div className="mt-6 flex flex-col gap-1.5" role="group" aria-label="Filter reviews by rating">
          {([5, 4, 3, 2, 1] as const).map((star) => {
            const count = stats.histogram[star];
            const percent = stats.count ? Math.round((count / stats.count) * 100) : 0;
            const active = ratingFilter === star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setRatingFilter(active ? null : star)}
                aria-pressed={active}
                className={cn(
                  "focus-ring flex items-center gap-3 rounded-lg px-2 py-1 text-left text-xs transition-colors",
                  active ? "bg-sand/60" : "hover:bg-sand/30",
                )}
              >
                <span className="w-10 shrink-0 text-stone">{star} star</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                  <span
                    className="block h-full rounded-full bg-champagne"
                    style={{ width: `${percent}%` }}
                  />
                </span>
                <span className="w-8 shrink-0 text-right text-stone">{count}</span>
              </button>
            );
          })}
          {ratingFilter && (
            <button
              type="button"
              onClick={() => setRatingFilter(null)}
              className="focus-ring self-start text-xs font-medium text-charcoal underline-offset-4 hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {writeOpen && (
        <div className="mt-6">
          <WriteReviewForm
            productSlug={product.slug}
            productName={product.name}
            onCancel={() => setWriteOpen(false)}
            onSubmit={(review) => {
              addSubmittedReview(review);
              setWriteOpen(false);
            }}
          />
        </div>
      )}

      <div className="mt-8 flex items-center justify-between border-t border-sand pt-6">
        <p className="text-sm text-stone">
          {visibleReviews.length} {visibleReviews.length === 1 ? "review" : "reviews"}
          {ratingFilter ? ` at ${ratingFilter} stars` : ""}
        </p>
        <div className="relative inline-flex items-center">
          <label htmlFor="review-sort" className="sr-only">
            Sort reviews
          </label>
          <select
            id="review-sort"
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="focus-ring h-10 rounded-full border border-sand bg-white px-4 text-xs text-charcoal transition-colors hover:border-charcoal/40"
          >
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                Sort: {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {visibleReviews.length === 0 ? (
        <p className="py-10 text-center text-sm text-stone">No reviews match this filter yet.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-sand">
          {visibleReviews.map((review) => {
            const voted = votedIds.has(review.id);
            const helpfulCount = (review.helpfulCount ?? 0) + (voted ? 1 : 0);
            return (
              <li key={review.id} className="flex flex-col gap-2 py-6">
                <div className="flex flex-wrap items-center gap-2">
                  <Rating value={review.rating} size="xs" />
                  {review.verified && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      Verified Purchase
                    </span>
                  )}
                </div>
                {review.title && <p className="font-medium text-charcoal">{review.title}</p>}
                <p className="text-sm leading-relaxed text-stone">{review.review}</p>

                {review.images && review.images.length > 0 && (
                  <div className="mt-1 flex gap-2">
                    {review.images.map((image) => (
                      <button
                        key={image}
                        type="button"
                        onClick={() => setEnlargedImage(image)}
                        aria-label="View customer photo full-size"
                        className="focus-ring relative h-16 w-16 overflow-hidden rounded-lg border border-sand"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- a submitted review's photo may be a transient blob: URL, which next/image can't optimize */}
                        <img src={image} alt="Customer photo" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-1 flex items-center justify-between text-xs text-stone">
                  <span>
                    {review.customerName} · {review.location}
                    {review.date ? ` · ${review.date}` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => markHelpful(review.id)}
                    disabled={voted}
                    aria-pressed={voted}
                    className="focus-ring flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-sand/40 disabled:cursor-default"
                  >
                    <ThumbsUp className={cn("h-3.5 w-3.5", voted && "fill-charcoal")} />
                    Helpful{helpfulCount > 0 ? ` (${helpfulCount})` : ""}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal open={Boolean(enlargedImage)} onClose={() => setEnlargedImage(null)} className="max-w-md p-4">
        {enlargedImage && (
          <div className="relative aspect-square overflow-hidden rounded-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element -- a submitted review's photo may be a transient blob: URL, which next/image can't optimize */}
            <img src={enlargedImage} alt="Customer photo, enlarged" className="h-full w-full object-cover" />
          </div>
        )}
      </Modal>
    </div>
  );
}
