"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { DEFAULT_FILTERS, getActiveFilterCount, type CatalogueFacets, type CatalogueFilters } from "@/lib/catalogue";
import { FilterPanel } from "@/components/catalogue/FilterPanel";
import { Button } from "@/components/ui/Button";
import { useMounted } from "@/lib/hooks/use-mounted";

/**
 * Mobile filter surface: a slide-up sheet with its own draft state, so
 * scrubbing through options doesn't re-filter the grid on every tap —
 * changes only commit to the URL when "Apply filters" is pressed.
 */
export function FilterDrawer({
  open,
  onClose,
  filters,
  onApply,
  facets,
  lockedCategory,
  lockedCollection,
}: {
  open: boolean;
  onClose: () => void;
  filters: CatalogueFilters;
  onApply: (filters: CatalogueFilters) => void;
  facets: CatalogueFacets;
  lockedCategory?: string;
  lockedCollection?: string;
}) {
  const mounted = useMounted();
  const [draft, setDraft] = React.useState(filters);

  // Re-seed the draft from the committed filters each time the drawer opens
  // — adjusted during render (not an effect) per React's "resetting state
  // when a prop changes" pattern, avoiding an extra render pass.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(filters);
  }

  React.useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!mounted) return null;

  const draftCount = getActiveFilterCount(draft);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex max-h-[85vh] w-full flex-col rounded-t-3xl bg-warm-white shadow-lifted"
          >
            <div className="flex items-center justify-between border-b border-sand px-5 py-4">
              <h2 className="font-display text-xl text-charcoal">
                Filters{draftCount > 0 ? ` (${draftCount})` : ""}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close filters"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full hover:bg-sand"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5">
              <FilterPanel
                filters={draft}
                onChange={setDraft}
                facets={facets}
                lockedCategory={lockedCategory}
                lockedCollection={lockedCollection}
              />
            </div>

            <div className="flex items-center gap-3 border-t border-sand px-5 py-4">
              <Button type="button" variant="secondary" className="flex-1" onClick={() => setDraft(DEFAULT_FILTERS)}>
                Clear all
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => {
                  onApply(draft);
                  onClose();
                }}
              >
                Apply filters{draftCount > 0 ? ` (${draftCount})` : ""}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
