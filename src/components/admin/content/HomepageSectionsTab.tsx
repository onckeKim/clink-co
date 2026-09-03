"use client";

import * as React from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Loader2 } from "lucide-react";
import type { HomepageSectionsConfig } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { toast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero carousel",
  "feature-strip": "Feature strip",
  "category-showcase": "Category showcase",
  editorial: "Editorial section",
  bestsellers: "Bestsellers",
  "new-arrivals": "New arrivals",
  "curated-collections": "Curated collections",
  "brand-story": "Brand story",
  reviews: "Customer reviews",
  "social-gallery": "Social gallery",
  newsletter: "Newsletter",
  "recently-viewed": "Recently viewed",
};

export function HomepageSectionsTab() {
  const [config, setConfig] = React.useState<HomepageSectionsConfig | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/admin/content/homepage-sections")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { homepageSections?: HomepageSectionsConfig } | null) => setConfig(data?.homepageSections ?? null));
  }, []);

  const save = async (next: HomepageSectionsConfig) => {
    setConfig(next);
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content/homepage-sections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save the section order.");
        return;
      }
      setConfig(data.homepageSections);
    } finally {
      setSaving(false);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    if (!config) return;
    const target = index + direction;
    if (target < 0 || target >= config.order.length) return;
    const order = [...config.order];
    [order[index], order[target]] = [order[target]!, order[index]!];
    save({ ...config, order });
  };

  const toggleHidden = (key: string) => {
    if (!config) return;
    const hidden = config.hidden.includes(key) ? config.hidden.filter((k) => k !== key) : [...config.hidden, key];
    save({ ...config, hidden });
  };

  if (!config) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-stone">Controls which sections show on the homepage, and in what order.</p>
      {config.order.map((key, i) => {
        const hidden = config.hidden.includes(key);
        return (
          <div key={key} className={cn("flex items-center gap-4 rounded-2xl border border-sand p-4", hidden && "opacity-50")}>
            <div className="flex flex-col gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || saving} aria-label="Move up" className="focus-ring flex h-6 w-6 items-center justify-center rounded-full text-stone hover:bg-porcelain disabled:opacity-30">
                <ArrowUp className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === config.order.length - 1 || saving} aria-label="Move down" className="focus-ring flex h-6 w-6 items-center justify-center rounded-full text-stone hover:bg-porcelain disabled:opacity-30">
                <ArrowDown className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="flex-1 text-charcoal">{SECTION_LABELS[key] ?? key}</p>
            <Button type="button" variant="ghost" size="sm" onClick={() => toggleHidden(key)} disabled={saving}>
              {hidden ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {hidden ? "Hidden" : "Visible"}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
