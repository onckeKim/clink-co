import "server-only";
import { createQuestion, getPublishedQuestions, type QuestionWithAnswer } from "@/lib/db/qa";
import type { QAEntry } from "@/data/qa";

function toQAEntry(row: QuestionWithAnswer, productSlug: string): QAEntry {
  const answer = row.product_answers[0];
  return {
    id: row.id,
    productSlug,
    question: row.question,
    askedBy: row.asked_by_name,
    askedAt: row.created_at.slice(0, 10),
    answer: answer?.answer,
    answeredBy: answer?.answered_by_name,
    answeredAt: answer?.created_at.slice(0, 10),
    helpfulCount: answer?.helpful_count,
  };
}

/** Published Q&A for a product — every question is published the moment it's asked (see supabase/migrations/20250101000600_reviews_and_qa.sql), so there's no pending state to merge in like reviews has. */
export async function getQAForProduct(productId: string, productSlug: string): Promise<QAEntry[]> {
  const rows = await getPublishedQuestions(productId);
  return rows.map((row) => toQAEntry(row, productSlug));
}

export interface SubmitQuestionInput {
  question: string;
  askedByName: string;
}

/** Writes a signed-in customer's question for real — lands published immediately, matching the app's existing un-moderated Q&A behavior. */
export async function submitQuestion(
  userId: string,
  productId: string,
  productSlug: string,
  input: SubmitQuestionInput,
): Promise<QAEntry> {
  const row = await createQuestion({
    product_id: productId,
    user_id: userId,
    asked_by_name: input.askedByName.trim() || "Anonymous",
    question: input.question.trim(),
  });
  return toQAEntry({ ...row, product_answers: [] }, productSlug);
}
