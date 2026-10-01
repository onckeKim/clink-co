import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/dal";
import { getProducts } from "@/data/products";
import { submitQuestion } from "@/lib/qa-store";
import { dbErrorResponse } from "@/lib/db/errors";

const postSchema = z.object({
  productId: z.string().trim().min(1),
  question: z.string().trim().min(5).max(1000),
  askedByName: z.string().trim().max(120).optional(),
});

/** Signed-in Q&A submission — lands published immediately (see src/lib/qa-store.ts). Guests keep today's local-only QandASection flow and never reach this route. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to ask a question." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid question." }, { status: 400 });
  }

  try {
    const products = await getProducts();
    const product = products.find((p) => p.id === parsed.data.productId);
    if (!product) return NextResponse.json({ error: "That product doesn't exist." }, { status: 404 });

    const entry = await submitQuestion(user.id, product.id, product.slug, {
      question: parsed.data.question,
      askedByName: parsed.data.askedByName ?? "Anonymous",
    });
    return NextResponse.json({ entry });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
