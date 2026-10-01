import { NextResponse } from "next/server";
import { createClientOrNull } from "@/lib/supabase/safe-client";

export async function POST() {
  const supabase = await createClientOrNull();
  // Nothing to sign out of if Supabase isn't configured — logging out is
  // never itself an error the customer needs to see.
  if (supabase) await supabase.auth.signOut();
  return NextResponse.json({ ok: true });
}
