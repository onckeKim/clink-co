"use client";

import * as React from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import type { FaqEntry } from "@/types/content";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";

interface FormState {
  question: string;
  answer: string;
  category: string;
  sortOrder: string;
}

const emptyForm: FormState = { question: "", answer: "", category: "", sortOrder: "0" };

function fromFaq(faq: FaqEntry): FormState {
  return { question: faq.question, answer: faq.answer, category: faq.category, sortOrder: String(faq.sortOrder) };
}

export function FaqsTab() {
  const [faqs, setFaqs] = React.useState<FaqEntry[] | null>(null);
  const [editing, setEditing] = React.useState<FaqEntry | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [form, setForm] = React.useState<FormState>(emptyForm);
  const [saving, setSaving] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const load = React.useCallback(() => {
    fetch("/api/admin/content/faqs")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { faqs?: FaqEntry[] } | null) => setFaqs(data?.faqs ?? []));
  }, []);

  React.useEffect(load, [load]);

  const openCreate = () => {
    setForm(emptyForm);
    setCreating(true);
  };

  const openEdit = (faq: FaqEntry) => {
    setForm(fromFaq(faq));
    setEditing(faq);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim() || !form.category.trim()) {
      toast.error("Fill in question, answer and category.");
      return;
    }
    setSaving(true);
    try {
      const payload = { question: form.question, answer: form.answer, category: form.category, sortOrder: Number(form.sortOrder) || 0 };
      const res = await fetch(editing ? `/api/admin/content/faqs/${editing.id}` : "/api/admin/content/faqs", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this FAQ.");
        return;
      }
      toast.success(editing ? "FAQ updated." : "FAQ created.");
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
      const res = await fetch(`/api/admin/content/faqs/${confirmDeleteId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Couldn't delete this FAQ.");
        return;
      }
      toast.success("FAQ deleted.");
      setConfirmDeleteId(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  if (faqs === null) {
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
          New FAQ
        </Button>
      </div>

      {faqs.map((faq) => (
        <div key={faq.id} className="flex items-center gap-4 rounded-2xl border border-sand p-4">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-charcoal">{faq.question}</p>
            <p className="truncate text-xs text-stone">{faq.category}</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(faq)} aria-label="Edit FAQ">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => setConfirmDeleteId(faq.id)} aria-label="Delete FAQ">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <Modal open={creating || editing !== null} onClose={closeModal} title={editing ? "Edit FAQ" : "New FAQ"} className="max-w-xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="faq-category">Category</Label>
            <Input id="faq-category" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Shipping" required />
          </div>
          <div>
            <Label htmlFor="faq-question">Question</Label>
            <Input id="faq-question" value={form.question} onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="faq-answer">Answer</Label>
            <Textarea id="faq-answer" value={form.answer} onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="faq-order">Sort order within category</Label>
            <Input id="faq-order" type="number" inputMode="numeric" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
          </div>
          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editing ? "Save changes" : "Create FAQ"}
          </Button>
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete this FAQ?"
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />
    </div>
  );
}
