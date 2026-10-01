import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ConsentPreferences {
  analytics: boolean;
  marketing: boolean;
}

interface ConsentState extends ConsentPreferences {
  /** Whether the visitor has made an explicit choice (banner should stay hidden). */
  hasDecided: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  savePreferences: (prefs: ConsentPreferences) => void;
  /** Reopen the banner/preferences — used by a persistent "Cookie settings" link. */
  reset: () => void;
}

export const useConsentStore = create<ConsentState>()(
  persist(
    (set) => ({
      hasDecided: false,
      analytics: false,
      marketing: false,

      acceptAll: () => set({ hasDecided: true, analytics: true, marketing: true }),
      rejectNonEssential: () => set({ hasDecided: true, analytics: false, marketing: false }),
      savePreferences: (prefs) => set({ hasDecided: true, ...prefs }),
      reset: () => set({ hasDecided: false }),
    }),
    {
      name: "clink-co-cookie-consent",
    },
  ),
);
