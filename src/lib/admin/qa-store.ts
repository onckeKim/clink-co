import "server-only";
import {
  createAnswer,
  deleteAnswer,
  deleteQuestion,
  getQuestionByIdForAdmin,
  listQuestionsForAdmin,
  updateAnswer,
  updateQuestionStatus,
  type AdminQuestionRow,
} from "@/lib/db/qa";
import type { ModerationStatusEnum } from "@/lib/supabase/types";

export interface AdminQuestion {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  question: string;
  askedBy: string;
  askedAt: string;
  status: ModerationStatusEnum;
  answered: boolean;
  answerId: string | null;
  answerText: string | null;
  answeredBy: string | null;
}

function toAdminQuestion(row: AdminQuestionRow): AdminQuestion {
  const answer = row.product_answers[0];
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? "(deleted product)",
    productSlug: row.products?.slug ?? "",
    question: row.question,
    askedBy: row.asked_by_name,
    askedAt: row.created_at,
    status: row.status,
    answered: Boolean(answer),
    answerId: answer?.id ?? null,
    answerText: answer?.answer ?? null,
    answeredBy: answer?.answered_by_name ?? null,
  };
}

/** The "needs a reply" queue — every question, or only those still awaiting an answer. */
export async function listQuestions(unansweredOnly?: boolean): Promise<AdminQuestion[]> {
  const rows = await listQuestionsForAdmin(unansweredOnly);
  return rows.map(toAdminQuestion);
}

export async function getAdminQuestion(id: string): Promise<AdminQuestion | null> {
  const row = await getQuestionByIdForAdmin(id);
  return row ? toAdminQuestion(row) : null;
}

/** Posts staff's first reply. Assumes the question isn't already answered — the caller (the API route) checks that against the row it already fetched as `before`. */
export async function answerQuestion(questionId: string, staffUserId: string, text: string, answeredByName?: string): Promise<void> {
  await createAnswer({
    question_id: questionId,
    answer: text,
    answered_by_user_id: staffUserId,
    ...(answeredByName ? { answered_by_name: answeredByName } : {}),
  });
}

export async function editAnswer(answerId: string, text: string): Promise<void> {
  await updateAnswer(answerId, text);
}

export async function removeAnswer(answerId: string): Promise<void> {
  await deleteAnswer(answerId);
}

/** Hides a question from the public list (or restores a previously-rejected one). */
export async function moderateQuestion(id: string, status: "published" | "rejected"): Promise<void> {
  await updateQuestionStatus(id, status);
}

export async function removeQuestion(id: string): Promise<void> {
  await deleteQuestion(id);
}
