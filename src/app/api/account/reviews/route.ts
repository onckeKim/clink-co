import { NextResponse } from "next/server";
import { z } from "zod";
import { getUser } from "@/lib/supabase/dal";
import { getProducts } from "@/data/products";
import { submitReview } from "@/lib/reviews-store";
import { dbErrorResponse } from "@/lib/db/errors";

const postSchema = z.object({
  productId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(200).optional(),
  body: z.string().trim().min(10).max(4000),
  customerName: z.string().trim().max(120).optional(),
  location: z.string().trim().max(120).optional(),
  images: z.array(z.string()).max(4).optional(),
});

/** Signed-in review submission — see src/lib/reviews-store.ts for what happens on write (starts pending, verified computed from real orders). Guests keep today's local-only WriteReviewForm flow and never reach this route. */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) return NextResponse.json({ error: "Sign in to write a review." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid review." }, { status: 400 });
  }

  try {
    const products = await getProducts();
    const product = products.find((p) => p.id === parsed.data.productId);
    if (!product) return NextResponse.json({ error: "That product doesn't exist." }, { status: 404 });

    const review = await submitReview(user.id, product.id, { slug: product.slug, name: product.name }, {
      rating: parsed.data.rating,
      title: parsed.data.title,
      body: parsed.data.body,
      customerName: parsed.data.customerName ?? "Anonymous",
      location: parsed.data.location,
      images: parsed.data.images,
    });
    return NextResponse.json({ review });
  } catch (err) {
    return dbErrorResponse(err);
  }
}
