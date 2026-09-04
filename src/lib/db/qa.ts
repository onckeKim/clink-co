import "server-only";
import { getDb } from "./client";
import { unwrap } from "./errors";
import type { Database } from "@/lib/supabase/types";

type QuestionRow = Database["public"]["Tables"]["product_questions"]["Row"];
type QuestionInsert = Database["public"]["Tables"]["product_questions"]["Insert"];
type AnswerRow = Database["public"]["Tables"]["product_answers"]["Row"];

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
