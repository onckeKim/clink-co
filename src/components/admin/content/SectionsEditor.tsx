"use client";

import { Plus, Trash2 } from "lucide-react";
import type { AboutPageSection } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";

/** Heading + body pairs — shared by the about page and each policy page, both of which are just a title, an intro, and a list of these. */
export function SectionsEditor({
  sections,
  onChange,
}: {
  sections: AboutPageSection[];
  onChange: (sections: AboutPageSection[]) => void;
}) {
  const update = (index: number, patch: Partial<AboutPageSection>) => {
    onChange(sections.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const remove = (index: number) => onChange(sections.filter((_, i) => i !== index));

  const add = () => onChange([...sections, { heading: "", body: "" }]);

  return (
    <div className="flex flex-col gap-4">
      {sections.map((section, i) => (
        <div key={i} className="rounded-2xl border border-sand p-4">
          <div className="mb-3 flex items-center justify-between">
            <Label htmlFor={`section-heading-${i}`} className="mb-0">
              Section {i + 1}
            </Label>
            <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} aria-label="Remove section">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <Input
            id={`section-heading-${i}`}
            value={section.heading}
            onChange={(e) => update(i, { heading: e.target.value })}
            placeholder="Heading"
            className="mb-2"
          />
          <Textarea value={section.body} onChange={(e) => update(i, { body: e.target.value })} placeholder="Body copy" />
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={add} className="w-fit">
        <Plus className="h-4 w-4" />
        Add section
      </Button>
    </div>
  );
}
