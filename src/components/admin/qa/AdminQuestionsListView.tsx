"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, MessageCircleReply, Trash2, XCircle } from "lucide-react";
import type { AdminQuestion } from "@/lib/admin/qa-store";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { Textarea } from "@/components/ui/Textarea";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { toast } from "@/components/ui/Toast";

type TabFilter = "unanswered" | "answered" | "all";

const TABS: TabItem[] = [
  { id: "unanswered", label: "Unanswered" },
  { id: "answered", label: "Answered" },
  { id: "all", label: "All" },
];

function statusBadge(status: AdminQuestion["status"]) {
  return status === "rejected" ? <Badge variant="error">Rejected</Badge> : null;
}

export function AdminQuestionsListView() {
  const [tab, setTab] = React.useState<TabFilter>("unanswered");
  const [questions, setQuestions] = React.useState<AdminQuestion[] | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);

  const [replyTarget, setReplyTarget] = React.useState<AdminQuestion | null>(null);
  const [replyText, setReplyText] = React.useState("");
  const [replyName, setReplyName] = React.useState("");
  const [replyError, setReplyError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [confirmRemoveAnswerId, setConfirmRemoveAnswerId] = React.useState<string | null>(null);
  const [removingAnswer, setRemovingAnswer] = React.useState(false);

  const load = React.useCallback((filter: TabFilter) => {
    const query = filter === "unanswered" ? "?unanswered=1" : "";
    fetch(`/api/admin/questions${query}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { questions?: AdminQuestion[] } | null) => {
        const all = data?.questions ?? [];
        setQuestions(filter === "answered" ? all.filter((q) => q.answered) : all);
      });
  }, []);

  React.useEffect(() => load(tab), [tab, load]);

  const openReply = (question: AdminQuestion) => {
    setReplyTarget(question);
    setReplyText(question.answerText ?? "");
    setReplyName(question.answeredBy ?? "Clink & Co Team");
    setReplyError(null);
  };
  const closeReply = () => setReplyTarget(null);

  const submitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyTarget) return;
    if (replyText.trim().length === 0) {
      setReplyError("Enter a reply.");
      return;
    }

    setSaving(true);
    try {
      const editing = replyTarget.answered;
      const res = await fetch(`/api/admin/questions/${replyTarget.id}/answer`, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editing ? { answer: replyText } : { answer: replyText, answeredByName: replyName.trim() || undefined },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't save this reply.");
        return;
      }
      toast.success(editing ? "Reply updated." : "Reply posted.");
      closeReply();
      load(tab);
    } finally {
      setSaving(false);
    }
  };

  const moderate = async (id: string, status: "published" | "rejected") => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't update this question.");
        return;
      }
      toast.success(status === "rejected" ? "Question rejected." : "Question restored.");
      load(tab);
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/questions/${confirmDeleteId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't delete this question.");
        return;
      }
      toast.success("Question deleted.");
      setConfirmDeleteId(null);
      load(tab);
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveAnswer = async () => {
    if (!confirmRemoveAnswerId) return;
    setRemovingAnswer(true);
    try {
      const res = await fetch(`/api/admin/questions/${confirmRemoveAnswerId}/answer`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't remove this reply.");
        return;
      }
      toast.success("Reply removed.");
      setConfirmRemoveAnswerId(null);
      load(tab);
    } finally {
      setRemovingAnswer(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Questions</h1>
        <p className="mt-1.5 text-sm text-stone">
          Customer questions publish immediately — reply here to give shoppers a real answer instead of
          &ldquo;awaiting an answer&rdquo;.
        </p>
      </div>

      <Tabs items={TABS} value={tab} onChange={(id) => setTab(id as TabFilter)} />

      {questions === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : questions.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone">No questions in this view.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Asked by</TableHead>
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead>Asked</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questions.map((question) => (
              <TableRow key={question.id}>
                <TableCell>
                  {question.productSlug ? (
                    <Link href={`/products/${question.productSlug}`} target="_blank" className="link-underline font-medium text-charcoal">
                      {question.productName}
                    </Link>
                  ) : (
                    <span className="text-stone">{question.productName}</span>
                  )}
                </TableCell>
                <TableCell className="max-w-[140px] truncate">{question.askedBy}</TableCell>
                <TableCell className="max-w-xs truncate text-stone">{question.question}</TableCell>
                <TableCell className="max-w-xs">
                  {question.answered ? (
                    <button
                      type="button"
                      onClick={() => openReply(question)}
                      className="focus-ring block truncate text-left text-stone hover:text-charcoal hover:underline"
                    >
                      {question.answerText}
                    </button>
                  ) : (
                    <span className="text-xs text-stone">Awaiting an answer</span>
                  )}
                  {statusBadge(question.status)}
                </TableCell>
                <TableCell className="text-stone">{question.askedAt.slice(0, 10)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    {question.answered ? (
                      <>
                        <Button type="button" variant="ghost" size="icon" onClick={() => openReply(question)} aria-label="Edit reply">
                          <MessageCircleReply className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setConfirmRemoveAnswerId(question.id)}
                          aria-label="Remove reply"
                        >
                          <XCircle className="h-4 w-4 text-error" />
                        </Button>
                      </>
                    ) : (
                      <Button type="button" variant="ghost" size="icon" onClick={() => openReply(question)} aria-label="Reply">
                        <MessageCircleReply className="h-4 w-4 text-success" />
                      </Button>
                    )}
                    {question.status === "rejected" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moderate(question.id, "published")}
                        disabled={busyId === question.id}
                        aria-label="Restore question"
                        className="text-success"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => moderate(question.id, "rejected")}
                        disabled={busyId === question.id}
                        aria-label="Reject question"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDeleteId(question.id)}
                      aria-label="Delete question"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal open={replyTarget !== null} onClose={closeReply} title={replyTarget?.answered ? "Edit reply" : "Reply"} className="max-w-lg">
        {replyTarget && (
          <form onSubmit={submitReply} className="flex flex-col gap-4">
            <p className="rounded-xl bg-porcelain p-3 text-sm text-stone">
              <span className="font-medium text-charcoal">{replyTarget.askedBy}</span> asked: &ldquo;{replyTarget.question}&rdquo;
            </p>
            <div>
              <Label htmlFor="answer-text">Your reply</Label>
              <Textarea
                id="answer-text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                className="mt-1.5"
                error={replyError ?? undefined}
              />
            </div>
            {!replyTarget.answered && (
              <div>
                <Label htmlFor="answer-name">Reply as</Label>
                <Input id="answer-name" value={replyName} onChange={(e) => setReplyName(e.target.value)} className="mt-1.5" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {replyTarget.answered ? "Save changes" : "Post reply"}
              </Button>
              <Button type="button" variant="ghost" onClick={closeReply}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <ConfirmDialog
        open={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={handleDeleteQuestion}
        title="Delete this question?"
        description="This removes it permanently, including any reply. This can't be undone."
        confirmLabel="Delete"
        destructive
        loading={deleting}
      />

      <ConfirmDialog
        open={confirmRemoveAnswerId !== null}
        onClose={() => setConfirmRemoveAnswerId(null)}
        onConfirm={handleRemoveAnswer}
        title="Remove this reply?"
        description="The question goes back to awaiting an answer. This can't be undone."
        confirmLabel="Remove"
        destructive
        loading={removingAnswer}
      />
    </div>
  );
}
