import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Review } from "@/data/reviews";

/**
 * Customer-submitted reviews, persisted to this browser only — there's no
 * reviews API/table yet (see README), so "submit a review" here means
 * "append it to this device's local store" rather than a real, shared
 * submission. Real submission needs a `reviews` table + moderation queue;
 * see the PDP write-up for the full data-requirements list.
 */
interface SubmittedReviewsState {
  reviews: Review[];
  add: (review: Review) => void;
}

export const useSubmittedReviewsStore = create<SubmittedReviewsState>()(
  persist(
    (set, get) => ({
      reviews: [],
      add: (review) => set({ reviews: [review, ...get().reviews] }),
    }),
    { name: "clink-co-submitted-reviews" },
  ),
);
