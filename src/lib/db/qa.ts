import "server-only";
import { getDb } from "./client";
import { mapPostgrestError, unwrap, unwrapNullable } from "./errors";
import type { Database, ModerationStatusEnum } from "@/lib/supabase/types";

type QuestionRow = Database["public"]["Tables"]["product_questions"]["Row"];
type QuestionInsert = Database["public"]["Tables"]["product_questions"]["Insert"];
type AnswerRow = Database["public"]["Tables"]["product_answers"]["Row"];
type AnswerInsert = Database["public"]["Tables"]["product_answers"]["Insert"];

// Hand-authored types.ts has no `Relationships` metadata, so this embedded
// select needs an explicit cast on the way out — see db/products.ts's
// castEmbedded() for the identical rationale.
export interface QuestionWithAnswer extends QuestionRow {
  product_answers: AnswerRow[];
}

/** Published questions for a product (with their answer, if any) — matches RLS's product_questions_select_published. Unlike reviews, a question is published the moment it's asked (see the migration's own comment), so this is the full public list, not a moderation-filtered subset. */
export async function getPublishedQuestions(productId: string): Promise<QuestionWithAnswer[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("product_questions")
    .select("*, product_answers(*)")
    .eq("product_id", productId)
    .eq("status", "published")
    .order("created_at", { ascending: false });
  return unwrap({ data, error }) as unknown as QuestionWithAnswer[];
}

export async function createQuestion(input: QuestionInsert): Promise<QuestionRow> {
  const db = await getDb();
  const { data, error } = await db.from("product_questions").insert(input).select().single();
  return unwrap({ data, error });
}

export interface AdminQuestionRow extends QuestionWithAnswer {
  products: { name: string; slug: string } | null;
}

/**
 * Every question across every product, newest first, with its product's
 * name/slug and its answer (if any) — the "needs a reply" queue. A
 * question publishes immediately on submission (see getPublishedQuestions's
 * comment), so unlike reviews there's no moderation status to filter on;
 * "unansweredOnly" filters by whether product_answers has a row instead.
 * RLS (product_questions_select_staff) restricts this to a session with
 * content:view.
 */
export async function listQuestionsForAdmin(unansweredOnly?: boolean): Promise<AdminQuestionRow[]> {
  const db = await getDb();
  const { data, error } = await db
    .from("product_questions")
    .select("*, product_answers(*), products(name, slug)")
    .order("created_at", { ascending: false });
  const rows = unwrap({ data, error }) as unknown as AdminQuestionRow[];
  return unansweredOnly ? rows.filter((row) => row.product_answers.length === 0) : rows;
}

export async function getQuestionByIdForAdmin(id: string): Promise<AdminQuestionRow | null> {
  const db = await getDb();
  const { data, error } = await db
    .from("product_questions")
    .select("*, product_answers(*), products(name, slug)")
    .eq("id", id)
    .maybeSingle();
  const row = unwrapNullable({ data, error });
  return row ? (row as unknown as AdminQuestionRow) : null;
}

/** Rejects a question (hides it from the public list) or restores it — product_answers_write_staff/product_questions_moderate_staff both require content:write. */
export async function updateQuestionStatus(id: string, status: Extract<ModerationStatusEnum, "published" | "rejected">): Promise<QuestionRow> {
  const db = await getDb();
  const { data, error } = await db.from("product_questions").update({ status }).eq("id", id).select().single();
  return unwrap({ data, error });
}

/** Removes a question outright (spam/abuse) — its answer, if any, cascades with it. */
export async function deleteQuestion(id: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("product_questions").delete().eq("id", id);
  if (error) throw mapPostgrestError(error);
}

/** Posts staff's first reply to a question — product_answers_write_staff requires content:write; question_id is unique, so this fails with a conflict if one already exists (use updateAnswer instead). */
export async function createAnswer(input: AnswerInsert): Promise<AnswerRow> {
  const db = await getDb();
  const { data, error } = await db.from("product_answers").insert(input).select().single();
  return unwrap({ data, error });
}

export async function updateAnswer(answerId: string, answer: string): Promise<AnswerRow> {
  const db = await getDb();
  const { data, error } = await db.from("product_answers").update({ answer }).eq("id", answerId).select().single();
  return unwrap({ data, error });
}

/** Retracts a reply, returning the question to "awaiting an answer". */
export async function deleteAnswer(answerId: string): Promise<void> {
  const db = await getDb();
  const { error } = await db.from("product_answers").delete().eq("id", answerId);
  if (error) throw mapPostgrestError(error);
}
