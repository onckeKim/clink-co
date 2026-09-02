import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { QAEntry } from "@/data/qa";

/** Customer-submitted questions, persisted to this browser only — same caveat as submitted-reviews-store: no backend yet, so nobody else sees these, and no one can answer them. */
interface SubmittedQuestionsState {
  entries: QAEntry[];
  add: (entry: QAEntry) => void;
}

export const useSubmittedQuestionsStore = create<SubmittedQuestionsState>()(
  persist(
    (set, get) => ({
      entries: [],
      add: (entry) => set({ entries: [entry, ...get().entries] }),
    }),
    { name: "clink-co-submitted-questions" },
  ),
);
