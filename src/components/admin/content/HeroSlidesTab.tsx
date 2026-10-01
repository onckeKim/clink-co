"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { HeroSlide } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";

interface FormState {
  eyebrow: string;
  heading: string;
  copy: string;
  image: string;
  imageAlt: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
}

const emptyForm: FormState = {
  eyebrow: "",
  heading: "",
  copy: "",
  image: "",
  imageAlt: "",
  primaryCtaLabel: "",
  primaryCtaHref: "",
  secondaryCtaLabel: "",
  secondaryCtaHref: "",
};

function fromSlide(slide: HeroSlide): FormState {
  return {
    eyebrow: slide.eyebrow,
    heading: slide.heading,
    copy: slide.copy,
    image: slide.image,
    imageAlt: slide.imageAlt,
    primaryCtaLabel: slide.primaryCta.label,
    primaryCtaHref: slide.primaryCta.href,
    secondaryCtaLabel: slide.secondaryCta.label,
    secondaryCtaHref: slide.secondaryCta.href,
  };
}

function toPayload(form: FormState) {
  return {
    eyebrow: form.eyebrow,
    heading: form.heading,
    copy: form.copy,
    image: form.image,
    imageAlt: form.imageAlt,
    primaryCta: { label: form.primaryCtaLabel, href: form.primaryCtaHref },
    secondaryCta: { label: form.secondaryCtaLabel, href: form.secondaryCtaHref },
  };
}

export function HeroSlidesTab() {
  const [slides, setSlides] = React.useState<HeroSlide[] | null>(null);
  const [editing, setEditing] = React.useState<HeroSlide | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/admin/content/hero-slides")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { heroSlides?: HeroSlide[] } | null) => setSlides(data?.heroSlides ?? []));
  }, []);

  React.useEffect(load, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (slide: HeroSlide) => {
    setForm(fromSlide(slide));
    setEditing(slide);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.heading.trim() || !form.image) {
      toast.error("A heading and image are required.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(editing ? `/api/admin/content/hero-slides/${editing.id}` : "/api/admin/content/hero-slides", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(form)),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this slide.");
        return;
      }
      toast.success(editing ? "Slide updated." : "Slide created.");
      closeModal();
      load();
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!slides) return;
    const target = index + direction;
    if (target < 0 || target >= slides.length) return;
    const next = [...slides];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setSlides(next);

    setReordering(true);
    try {
      const res = await fetch("/api/admin/content/hero-slides/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((s) => s.id) }),
      });
      const data = await res.json();
      if (res.ok) setSlides(data.heroSlides);
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/content/hero-slides/${confirmDeleteId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete this slide.");
        return;
      }
      toast.success("Slide deleted.");
      setConfirmDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  if (slides === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-stone" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New slide
        </Button>
      </div>

      {slides.map((slide, i) => (
        <div key={slide.id} className="flex items-center gap-4 rounded-2xl border border-sand p-4">
          <div className="flex flex-col gap-1">
            <button type="button" onClick={() => move(i, -1)} disabled={i === 0 || reordering} aria-label="Move up" className="focus-ring flex h-6 w-6 items-center justify-center rounded-full text-stone hover:bg-porcelain disabled:opacity-30">
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button type="button" onClick={() => move(i, 1)} disabled={i === slides.length - 1 || reordering} aria-label="Move down" className="focus-ring flex h-6 w-6 items-center justify-center rounded-full text-stone hover:bg-porcelain disabled:opacity-30">
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-sand/30">
            <Image src={slide.image} alt="" fill sizes="80px" className="object-cover" unoptimized={slide.image.startsWith("data:")} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-charcoal">{slide.heading}</p>
            <p className="truncate text-xs text-stone">{slide.eyebrow}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(slide)} aria-label="Edit slide">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setConfirmDeleteId(slide.id)} aria-label="Delete slide">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Modal open={creating || editing !== null} onClose={closeModal} title={editing ? "Edit hero slide" : "New hero slide"} className="max-w-xl">
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div>
            <Label htmlFor="hs-eyebrow">Eyebrow</Label>
            <Input id="hs-eyebrow" value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="hs-heading">Heading</Label>
            <Input id="hs-heading" value={form.heading} onChange={(e) => setForm((f) => ({ ...f, heading: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="hs-copy">Copy</Label>
            <Textarea id="hs-copy" value={form.copy} onChange={(e) => setForm((f) => ({ ...f, copy: e.target.value }))} />
          </div>
          <div>
            <Label>Image</Label>
            <SingleImageUploader value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} folder="hero" />
          </div>
          <div>
            <Label htmlFor="hs-alt">Image alt text</Label>
            <Input id="hs-alt" value={form.imageAlt} onChange={(e) => setForm((f) => ({ ...f, imageAlt: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="hs-primary-label">Primary CTA label</Label>
              <Input id="hs-primary-label" value={form.primaryCtaLabel} onChange={(e) => setForm((f) => ({ ...f, primaryCtaLabel: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="hs-primary-href">Primary CTA link</Label>
              <Input id="hs-primary-href" value={form.primaryCtaHref} onChange={(e) => setForm((f) => ({ ...f, primaryCtaHref: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="hs-secondary-label">Secondary CTA label</Label>
              <Input id="hs-secondary-label" value={form.secondaryCtaLabel} onChange={(e) => setForm((f) => ({ ...f, secondaryCtaLabel: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="hs-secondary-href">Secondary CTA link</Label>
              <Input id="hs-secondary-href" value={form.secondaryCtaHref} onChange={(e) => setForm((f) => ({ ...f, secondaryCtaHref: e.target.value }))} />
            </div>
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create slide"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this hero slide?"
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
