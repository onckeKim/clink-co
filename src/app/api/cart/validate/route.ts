import { NextResponse } from "next/server";
import { validateCartLines, type CartLineInput } from "@/lib/cart-validation";

/**
 * Server-side truth check for a client-held cart — re-verifies price and
 * stock against src/data/products.ts (swap for a Supabase query later)
 * rather than trusting whatever the browser has cached. Called
 * opportunistically from the cart page; enforced unconditionally by
 * POST /api/checkout.
 */
export async function POST(request: Request) {
  let body: { lines?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!Array.isArray(body.lines)) {
    return NextResponse.json({ error: "`lines` must be an array." }, { status: 400 });
  }

  const lines = body.lines as CartLineInput[];
  const result = validateCartLines(lines);
  return NextResponse.json(result);
}
