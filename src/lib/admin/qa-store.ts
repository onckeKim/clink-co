import "server-only";
import { listQuestionsForAdmin, type AdminQuestionRow } from "@/lib/db/qa";

export interface AdminQuestion {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  question: string;
  askedBy: string;
  askedAt: string;
  answered: boolean;
}

function toAdminQuestion(row: AdminQuestionRow): AdminQuestion {
  return {
    id: row.id,
    productId: row.product_id,
    productName: row.products?.name ?? "(deleted product)",
    productSlug: row.products?.slug ?? "",
    question: row.question,
    askedBy: row.asked_by_name,
    askedAt: row.created_at,
    answered: row.product_answers.length > 0,
  };
}

/** The "needs a reply" queue — every question, or only those still awaiting an answer. */
export async function listQuestions(unansweredOnly?: boolean): Promise<AdminQuestion[]> {
  const rows = await listQuestionsForAdmin(unansweredOnly);
  return rows.map(toAdminQuestion);
}
