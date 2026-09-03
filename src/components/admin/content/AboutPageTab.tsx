"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type { AboutPageContent } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { toast } from "@/components/ui/Toast";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";
import { SectionsEditor } from "@/components/admin/content/SectionsEditor";

export function AboutPageTab() {
  const [form, setForm] = React.useState<AboutPageContent | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/admin/content/about")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { about?: AboutPageContent } | null) => setForm(data?.about ?? null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/content/about", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save the about page.");
        return;
      }
      setForm(data.about);
      toast.success("About page updated.");
    } finally {
      setSaving(false);
    }
  };

  if (!form) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
      <div>
        <Label htmlFor="ab-eyebrow">Hero eyebrow</Label>
        <Input id="ab-eyebrow" value={form.heroEyebrow} onChange={(e) => setForm({ ...form, heroEyebrow: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="ab-title">Hero title</Label>
        <Input id="ab-title" value={form.heroTitle} onChange={(e) => setForm({ ...form, heroTitle: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="ab-desc">Hero description</Label>
        <Textarea id="ab-desc" value={form.heroDescription} onChange={(e) => setForm({ ...form, heroDescription: e.target.value })} />
      </div>
      <div>
        <Label>Hero image</Label>
        <SingleImageUploader value={form.heroImage} onChange={(url) => setForm({ ...form, heroImage: url })} folder="about" />
      </div>
      <div>
        <Label htmlFor="ab-alt">Hero image alt text</Label>
        <Input id="ab-alt" value={form.heroImageAlt} onChange={(e) => setForm({ ...form, heroImageAlt: e.target.value })} />
      </div>
      <div>
        <Label>Sections</Label>
        <SectionsEditor sections={form.sections} onChange={(sections) => setForm({ ...form, sections })} />
      </div>
      <Button type="submit" disabled={saving} className="w-fit">
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
