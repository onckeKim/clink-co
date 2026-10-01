"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { Category } from "@/types/category";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";

interface CategoryFormState {
  name: string;
  description: string;
  image: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
}

const emptyForm: CategoryFormState = { name: "", description: "", image: "", slug: "", seoTitle: "", seoDescription: "" };

export function CategoriesListView() {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [editing, setEditing] = React.useState<Category | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<CategoryFormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/admin/categories")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { categories?: Category[] } | null) => setCategories(data?.categories ?? []));
  }, []);

  React.useEffect(load, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (category: Category) => {
    setForm({
      name: category.name,
      description: category.description,
      image: category.image,
      slug: category.slug,
      seoTitle: category.seoTitle ?? "",
      seoDescription: category.seoDescription ?? "",
    });
    setEditing(category);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.description.trim() || !form.image) {
      toast.error("Name, description and image are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        image: form.image,
        slug: form.slug || undefined,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
      };
      const res = await fetch(editing ? `/api/admin/categories/${editing.id}` : "/api/admin/categories", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this category.");
        return;
      }
      toast.success(editing ? "Category updated." : "Category created.");
      closeModal();
      load();
    } finally {
      setSaving(false);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    if (!categories) return;
    const target = index + direction;
    if (target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target]!, next[index]!];
    setCategories(next);

    setReordering(true);
    try {
      const res = await fetch("/api/admin/categories/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: next.map((c) => c.id) }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't reorder categories.");
        load();
        return;
      }
      setCategories(data.categories);
    } finally {
      setReordering(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${confirmDeleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "This category can't be deleted.");
        return;
      }
      toast.success("Category deleted.");
      setConfirmDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-charcoal">Categories</h1>
          <p className="mt-1.5 text-sm text-stone">Order sets the display order across the storefront.</p>
        </div>
        <Button type="button" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New category
        </Button>
      </div>

      {categories === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {categories.map((category, i) => (
            <div key={category.id} className="flex items-center gap-4 rounded-2xl border border-sand p-4">
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0 || reordering}
                  aria-label="Move up"
                  className="focus-ring flex h-6 w-6 items-center justify-center rounded-full text-stone transition-colors hover:bg-porcelain disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === categories.length - 1 || reordering}
                  aria-label="Move down"
                  className="focus-ring flex h-6 w-6 items-center justify-center rounded-full text-stone transition-colors hover:bg-porcelain disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-sand/30">
                <Image src={category.image} alt="" fill sizes="56px" className="object-cover" unoptimized={category.image.startsWith("data:")} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-charcoal">{category.name}</p>
                <p className="truncate text-xs text-stone">
                  /shop/{category.slug} · {category.itemCount} products
                </p>
              </div>

              <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(category)} aria-label="Edit category">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setConfirmDeleteId(category.id)}
                aria-label="Delete category"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={creating || editing !== null} onClose={closeModal} title={editing ? "Edit category" : "New category"} className="max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              placeholder="auto-generated from name if left blank"
            />
          </div>
          <div>
            <Label htmlFor="cat-desc">Description</Label>
            <Textarea id="cat-desc" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} required />
          </div>
          <div>
            <Label>Image</Label>
            <SingleImageUploader value={form.image} onChange={(url) => setForm((f) => ({ ...f, image: url }))} folder="categories" />
          </div>
          <div>
            <Label htmlFor="cat-seo-title">SEO title</Label>
            <Input id="cat-seo-title" value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="cat-seo-desc">SEO description</Label>
            <Textarea id="cat-seo-desc" value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create category"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this category?"
        description="Categories with products still assigned to them can't be deleted — reassign those products first."
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
