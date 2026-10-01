import { create } from "zustand";

interface UIState {
  /** True while the sticky header is still overlapping a page's dark hero. */
  overHero: boolean;
  setOverHero: (value: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  overHero: false,
  setOverHero: (value) => set({ overHero: value }),
}));
