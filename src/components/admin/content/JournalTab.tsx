"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { JournalArticle } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/Checkbox";
import { toast } from "@/components/ui/Toast";
import { SingleImageUploader } from "@/components/admin/SingleImageUploader";
import { TagListInput } from "@/components/admin/products/TagListInput";

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  bodyText: string;
  coverImage: string;
  coverImageAlt: string;
  author: string;
  publishedAt: string;
  publishStatus: "draft" | "published";
  seoTitle: string;
  seoDescription: string;
  category: string;
  tags: string[];
  featured: boolean;
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  bodyText: "",
  coverImage: "",
  coverImageAlt: "",
  author: "Clink & Co Editorial",
  publishedAt: new Date().toISOString().slice(0, 10),
  publishStatus: "draft",
  seoTitle: "",
  seoDescription: "",
  category: "",
  tags: [],
  featured: false,
};

function fromArticle(article: JournalArticle): FormState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    bodyText: article.body.join("\n\n"),
    coverImage: article.coverImage,
    coverImageAlt: article.coverImageAlt,
    author: article.author,
    publishedAt: article.publishedAt.slice(0, 10),
    publishStatus: article.publishStatus,
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    category: article.category,
    tags: article.tags,
    featured: article.featured,
  };
}

export function JournalTab() {
  const [articles, setArticles] = React.useState<JournalArticle[] | null>(null);
  const [editing, setEditing] = React.useState<JournalArticle | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/admin/content/journal")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { articles?: JournalArticle[] } | null) => setArticles(data?.articles ?? []));
  }, []);

  React.useEffect(load, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (article: JournalArticle) => {
    setForm(fromArticle(article));
    setEditing(article);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body = form.bodyText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (!form.title.trim() || !form.excerpt.trim() || body.length === 0 || !form.coverImage || !form.category.trim()) {
      toast.error("Title, excerpt, body, cover image and category are required.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title,
        slug: form.slug || undefined,
        excerpt: form.excerpt,
        body,
        coverImage: form.coverImage,
        coverImageAlt: form.coverImageAlt,
        author: form.author,
        publishedAt: form.publishedAt,
        publishStatus: form.publishStatus,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        category: form.category,
        tags: form.tags,
        featured: form.featured,
      };
      const res = await fetch(editing ? `/api/admin/content/journal/${editing.id}` : "/api/admin/content/journal", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this article.");
        return;
      }
      toast.success(editing ? "Article updated." : "Article created.");
      closeModal();
      load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/content/journal/${confirmDeleteId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete this article.");
        return;
      }
      toast.success("Article deleted.");
      setConfirmDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  if (articles === null) {
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
          New article
        </Button>
      </div>

      {articles.map((article) => (
        <div key={article.id} className="flex items-center gap-4 rounded-2xl border border-sand p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-charcoal">{article.title}</p>
            <p className="truncate text-xs text-stone">/journal/{article.slug}</p>
          </div>
          {article.category && <Badge variant="neutral">{article.category}</Badge>}
          {article.featured && <Badge variant="champagne">Featured</Badge>}
          {article.publishStatus === "draft" ? <Badge variant="warning">Draft</Badge> : <Badge variant="success">Published</Badge>}
          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(article)} aria-label="Edit article">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setConfirmDeleteId(article.id)} aria-label="Delete article">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Modal open={creating || editing !== null} onClose={closeModal} title={editing ? "Edit article" : "New article"} className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div>
            <Label htmlFor="jr-title">Title</Label>
            <Input id="jr-title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="jr-slug">Slug</Label>
            <Input id="jr-slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="auto-generated from title if left blank" />
          </div>
          <div>
            <Label htmlFor="jr-excerpt">Excerpt</Label>
            <Textarea id="jr-excerpt" value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="jr-body">Body (separate paragraphs with a blank line)</Label>
            <Textarea id="jr-body" value={form.bodyText} onChange={(e) => setForm((f) => ({ ...f, bodyText: e.target.value }))} className="min-h-48" required />
          </div>
          <div>
            <Label>Cover image</Label>
            <SingleImageUploader value={form.coverImage} onChange={(url) => setForm((f) => ({ ...f, coverImage: url }))} folder="journal" />
          </div>
          <div>
            <Label htmlFor="jr-alt">Cover image alt text</Label>
            <Input id="jr-alt" value={form.coverImageAlt} onChange={(e) => setForm((f) => ({ ...f, coverImageAlt: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jr-author">Author</Label>
              <Input id="jr-author" value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="jr-date">Published date</Label>
              <Input id="jr-date" type="date" value={form.publishedAt} onChange={(e) => setForm((f) => ({ ...f, publishedAt: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="jr-status">Status</Label>
              <Select id="jr-status" value={form.publishStatus} onChange={(e) => setForm((f) => ({ ...f, publishStatus: e.target.value as "draft" | "published" }))}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="jr-category">Category</Label>
              <Input id="jr-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Entertaining" required />
            </div>
          </div>
          <div>
            <Label>Tags</Label>
            <TagListInput values={form.tags} onChange={(tags) => setForm((f) => ({ ...f, tags }))} placeholder="Type a tag and press Enter" />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox id="jr-featured" checked={form.featured} onCheckedChange={(checked) => setForm((f) => ({ ...f, featured: checked }))} />
            <Label htmlFor="jr-featured" className="mb-0 text-sm font-normal normal-case tracking-normal text-stone">
              Feature this article on the Journal listing
            </Label>
          </div>
          <div>
            <Label htmlFor="jr-seo-title">SEO title</Label>
            <Input id="jr-seo-title" value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="jr-seo-desc">SEO description</Label>
            <Textarea id="jr-seo-desc" value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create article"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this article?"
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
