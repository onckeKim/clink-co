"use client";

import * as React from "react";
import { HelpCircle, MessageCircleQuestion } from "lucide-react";
import type { Product } from "@/types/product";
import type { QAEntry } from "@/data/qa";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { useSubmittedQuestionsStore } from "@/store/submitted-questions-store";

export function QandASection({ product, seedEntries }: { product: Product; seedEntries: QAEntry[] }) {
  // Select the raw, stable array and filter in a memo — filtering inline in
  // the selector would return a new array reference on every read, which
  // breaks useSyncExternalStore's snapshot caching and causes an infinite
  // render loop.
  const allSubmittedEntries = useSubmittedQuestionsStore((state) => state.entries);
  const addQuestion = useSubmittedQuestionsStore((state) => state.add);
  const [formOpen, setFormOpen] = React.useState(false);
  const [askedBy, setAskedBy] = React.useState("");
  const [question, setQuestion] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const submitted = React.useMemo(
    () => allSubmittedEntries.filter((entry) => entry.productSlug === product.slug),
    [allSubmittedEntries, product.slug],
  );
  const entries = React.useMemo(() => [...submitted, ...seedEntries], [submitted, seedEntries]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim().length < 5) {
      setError("Enter a question of at least 5 characters.");
      return;
    }
    addQuestion({
      id: `local-q-${Date.now()}`,
      productSlug: product.slug,
      question: question.trim(),
      askedBy: askedBy.trim() || "Anonymous",
      askedAt: new Date().toISOString().slice(0, 10),
    });
    setQuestion("");
    setAskedBy("");
    setError(null);
    setFormOpen(false);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">
          Questions &amp; Answers
        </p>
        <Button type="button" variant="secondary" size="sm" onClick={() => setFormOpen((open) => !open)}>
          {formOpen ? "Close form" : "Ask a question"}
        </Button>
      </div>

      {formOpen && (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 rounded-2xl border border-sand p-5">
          <div>
            <Label htmlFor="qa-question">Your question</Label>
            <Textarea
              id="qa-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={`Ask us anything about the ${product.name}`}
              rows={3}
              className="mt-1.5 min-h-24"
            />
          </div>
          <div>
            <Label htmlFor="qa-name">Your name (optional)</Label>
            <Input
              id="qa-name"
              value={askedBy}
              onChange={(e) => setAskedBy(e.target.value)}
              placeholder="e.g. Karabo M."
              className="mt-1.5"
            />
          </div>
          {error && <p className="text-xs text-error">{error}</p>}
          <p className="text-xs text-stone">
            Saved to this browser and shown below — this demo has no live team to answer it yet, so it
            stays marked as awaiting an answer.
          </p>
          <div className="flex items-center gap-3">
            <Button type="submit">Submit question</Button>
            <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {entries.length === 0 ? (
        <p className="mt-6 text-sm text-stone">No questions yet — be the first to ask one.</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-sand">
          {entries.map((entry) => (
            <li key={entry.id} className="flex flex-col gap-2 py-5">
              <p className="flex items-start gap-2 text-sm font-medium text-charcoal">
                <MessageCircleQuestion className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                {entry.question}
              </p>
              <p className="pl-6 text-xs text-stone">
                {entry.askedBy} · {entry.askedAt}
              </p>
              {entry.answer ? (
                <p className="ml-6 rounded-xl bg-porcelain p-3 text-sm leading-relaxed text-stone">
                  <span className="font-medium text-charcoal">{entry.answeredBy ?? "Clink & Co Team"}:</span>{" "}
                  {entry.answer}
                </p>
              ) : (
                <p className="ml-6 flex items-center gap-1.5 text-xs text-stone">
                  <HelpCircle className="h-3.5 w-3.5" />
                  Awaiting an answer from our team
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
